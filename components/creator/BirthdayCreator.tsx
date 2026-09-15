'use client';
/* oxlint-disable next/no-img-element -- User uploads use temporary object URLs and signed Storage URLs. */
/* oxlint-disable jsx-a11y/media-has-caption -- Uploaded birthday music contains no dialogue track. */

import {
  ArrowDown,
  ArrowUp,
  Check,
  CloudOff,
  Copy,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Music2,
  Play,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { BirthdayExperience } from '@/components/birthday/BirthdayExperience';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { BIRTHDAY_TEMPLATES, createBirthdayConfig, type BirthdayConfig, type BirthdayTemplateId, type Memory } from '@/config/birthday';
import { useBirthdayDraft } from '@/hooks/useBirthdayDraft';
import { useIsMobile } from '@/hooks/use-mobile';
import { compressImage, validateAudio, validateImage } from '@/lib/media';
import { publishBirthdayPage, uploadBirthdayAsset } from '@/lib/supabase/birthday-pages';

type EditorSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  open?: boolean;
};

function EditorSection({ title, icon, children, open = false }: EditorSectionProps) {
  return (
    <details className="creator-section" open={open}>
      <summary><span>{icon}{title}</span><span className="section-chevron" aria-hidden="true">⌄</span></summary>
      <div className="creator-section-content">{children}</div>
    </details>
  );
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return <div className="creator-field"><Label htmlFor={htmlFor}>{label}</Label>{children}{hint ? <small>{hint}</small> : null}</div>;
}

function EffectRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="effect-row"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} aria-label={label} /></div>;
}

function SaveIndicator({ status, error }: { status: ReturnType<typeof useBirthdayDraft>['status']; error: string | null }) {
  if (status === 'offline') return <span className="save-indicator is-offline" title="Thêm biến môi trường để bật lưu đám mây"><CloudOff /> Chưa kết nối</span>;
  if (status === 'saving' || status === 'idle') return <span className="save-indicator"><LoaderCircle className="spin" /> Đang lưu...</span>;
  if (status === 'error') return <span className="save-indicator is-error" title={error ?? undefined}>Lỗi lưu</span>;
  return <span className="save-indicator is-saved"><Check /> Đã lưu</span>;
}

export function BirthdayCreator() {
  const [config, setConfig] = useState<BirthdayConfig>(() => createBirthdayConfig());
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const draft = useBirthdayDraft(config);

  const update = useCallback(<K extends keyof BirthdayConfig>(key: K, value: BirthdayConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  }, []);

  const updateEffect = useCallback((key: keyof BirthdayConfig['effects'], value: boolean) => {
    setConfig((current) => ({ ...current, effects: { ...current.effects, [key]: value } }));
  }, []);

  const handlePhotos = useCallback(async (files: FileList | File[]) => {
    const selected = Array.from(files);
    const validationError = selected.map(validateImage).find(Boolean);
    if (validationError) { setMediaError(validationError); return; }
    if (!selected.length) return;
    if (draft.configured && !draft.userId) { setMediaError('Đang kết nối tài khoản ẩn danh, vui lòng thử lại sau một chút.'); return; }
    setMediaError(null);
    setUploading(true);
    let temporary: Memory[] = [];
    try {
      const compressed = await Promise.all(selected.map(compressImage));
      temporary = compressed.map((file) => ({
        id: crypto.randomUUID(),
        src: URL.createObjectURL(file),
        alt: `Kỷ niệm ${file.name}`,
        caption: file.name.replace(/\.[^.]+$/, ''),
      } satisfies Memory));
      setConfig((current) => ({ ...current, memories: [...current.memories, ...temporary] }));

      if (!draft.configured) return;
      const pageId = await draft.ensurePage();
      if (!draft.userId) throw new Error('Đang tạo phiên ẩn danh, vui lòng thử lại sau một chút.');
      const uploaded = await Promise.all(compressed.map((file) => uploadBirthdayAsset({ userId: draft.userId!, pageId, folder: 'photos', file })));
      setConfig((current) => ({
        ...current,
        memories: current.memories.map((memory) => {
          const index = temporary.findIndex((item) => item.id === memory.id);
          if (index < 0) return memory;
          URL.revokeObjectURL(memory.src);
          return { ...memory, src: uploaded[index].signedUrl, storagePath: uploaded[index].path };
        }),
      }));
    } catch (reason) {
      temporary.forEach((memory) => URL.revokeObjectURL(memory.src));
      if (temporary.length) setConfig((current) => ({ ...current, memories: current.memories.filter((item) => !temporary.some((added) => added.id === item.id)) }));
      setMediaError(reason instanceof Error ? reason.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  }, [draft]);

  const moveMemory = useCallback((index: number, direction: number) => {
    setConfig((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.memories.length) return current;
      const memories = [...current.memories];
      [memories[index], memories[target]] = [memories[target], memories[index]];
      return { ...current, memories };
    });
  }, []);

  const removeMemory = useCallback((memory: Memory) => {
    setConfig((current) => ({ ...current, memories: current.memories.filter((item) => item.id !== memory.id) }));
    if (memory.src.startsWith('blob:')) URL.revokeObjectURL(memory.src);
  }, []);

  const handleMusic = useCallback(async (file?: File) => {
    if (!file) return;
    const validationError = validateAudio(file);
    if (validationError) { setMediaError(validationError); return; }
    if (draft.configured && !draft.userId) { setMediaError('Đang kết nối tài khoản ẩn danh, vui lòng thử lại sau một chút.'); return; }
    setMediaError(null);
    setUploading(true);
    const previousMusic = config.music;
    const temporaryUrl = URL.createObjectURL(file);
    setConfig((current) => ({ ...current, music: { src: temporaryUrl, name: file.name, volume: current.music?.volume ?? 0.35 } }));
    try {
      if (!draft.configured) return;
      const pageId = await draft.ensurePage();
      if (!draft.userId) throw new Error('Đang tạo phiên ẩn danh, vui lòng thử lại sau một chút.');
      const uploaded = await uploadBirthdayAsset({ userId: draft.userId, pageId, folder: 'music', file });
      URL.revokeObjectURL(temporaryUrl);
      setConfig((current) => ({ ...current, music: current.music ? { ...current.music, src: uploaded.signedUrl, storagePath: uploaded.path } : null }));
    } catch (reason) {
      URL.revokeObjectURL(temporaryUrl);
      setConfig((current) => current.music?.src === temporaryUrl ? { ...current, music: previousMusic } : current);
      setMediaError(reason instanceof Error ? reason.message : 'Không thể tải nhạc lên.');
    } finally {
      setUploading(false);
    }
  }, [config.music, draft]);

  const removeMusic = useCallback(() => {
    const current = config.music;
    update('music', null);
    if (current?.src.startsWith('blob:')) URL.revokeObjectURL(current.src);
  }, [config.music, update]);

  const validation = useMemo(() => {
    if (!config.recipientName.trim()) return 'Hãy nhập tên người nhận.';
    if (!Number.isFinite(config.age) || config.age < 1 || config.age > 120) return 'Tuổi phải nằm trong khoảng 1–120.';
    if (!config.birthday.trim()) return 'Hãy nhập ngày sinh.';
    if (!config.title.trim()) return 'Hãy nhập tiêu đề.';
    if (!config.wishes.some((wish) => wish.trim())) return 'Hãy viết ít nhất một lời chúc.';
    return null;
  }, [config]);

  const publish = useCallback(async () => {
    if (validation) { setPublishError(validation); return; }
    setPublishing(true);
    setPublishError(null);
    try {
      const pageId = await draft.flush();
      const slug = await publishBirthdayPage(pageId, structuredClone(config));
      setShareUrl(`${window.location.origin}/?wish=${encodeURIComponent(slug)}`);
    } catch (reason) {
      setPublishError(reason instanceof Error ? reason.message : 'Không thể xuất bản trang.');
    } finally {
      setPublishing(false);
    }
  }, [config, draft, validation]);

  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [shareUrl]);

  const share = useCallback(async () => {
    const webShare = (navigator as unknown as { share?: (data: ShareData) => Promise<void> }).share;
    if (!shareUrl || !webShare) return;
    await webShare.call(navigator, { title: `Sinh nhật ${config.recipientName}`, url: shareUrl });
  }, [config.recipientName, shareUrl]);

  const editor = (
    <aside className="creator-editor" aria-label="Trình chỉnh sửa trang sinh nhật">
      <div className="creator-brand"><span><Sparkles /> Birthday Creator</span><SaveIndicator status={draft.status} error={draft.error} /></div>
      <div className="creator-scroll">
        <EditorSection title="Thông tin" icon={<Sparkles />} open>
          <Field label="Tên người nhận" htmlFor="recipient-name"><Input id="recipient-name" value={config.recipientName} onChange={(event) => update('recipientName', event.target.value)} /></Field>
          <div className="creator-field-grid">
            <Field label="Tuổi" htmlFor="age"><Input id="age" type="number" min={1} max={120} value={config.age} onChange={(event) => update('age', Number(event.target.value))} /></Field>
            <Field label="Ngày sinh" htmlFor="birthday"><Input id="birthday" value={config.birthday} onChange={(event) => update('birthday', event.target.value)} placeholder="15/09" /></Field>
          </div>
          <Field label="Tiêu đề" htmlFor="title"><Input id="title" value={config.title} onChange={(event) => update('title', event.target.value)} /></Field>
          <Field label="Lời mở đầu" htmlFor="intro"><Textarea id="intro" value={config.intro} onChange={(event) => update('intro', event.target.value)} rows={3} /></Field>
        </EditorSection>

        <EditorSection title="Ảnh" icon={<ImagePlus />}>
          <button className="upload-dropzone" type="button" onClick={() => photoInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handlePhotos(event.dataTransfer.files); }}>
            {uploading ? <LoaderCircle className="spin" /> : <Upload />}<strong>Thả ảnh vào đây</strong><span>hoặc chọn nhiều ảnh · JPG, PNG, WebP · tối đa 10 MB</span>
          </button>
          <input ref={photoInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { void handlePhotos(event.target.files ?? []); event.target.value = ''; }} />
          <div className="photo-list">{config.memories.map((memory, index) => <div className="photo-item" key={memory.id}><img src={memory.src} alt="" /><div><Input aria-label={`Chú thích ảnh ${index + 1}`} value={memory.caption} onChange={(event) => setConfig((current) => ({ ...current, memories: current.memories.map((item) => item.id === memory.id ? { ...item, caption: event.target.value } : item) }))} /><div className="photo-actions"><Button variant="ghost" size="icon-sm" onClick={() => moveMemory(index, -1)} disabled={index === 0} aria-label="Đưa ảnh lên"><ArrowUp /></Button><Button variant="ghost" size="icon-sm" onClick={() => moveMemory(index, 1)} disabled={index === config.memories.length - 1} aria-label="Đưa ảnh xuống"><ArrowDown /></Button><Button variant="ghost" size="icon-sm" onClick={() => removeMemory(memory)} aria-label="Xóa ảnh"><Trash2 /></Button></div></div></div>)}</div>
        </EditorSection>

        <EditorSection title="Lời chúc" icon={<Sparkles />}>
          <Field label="Lời chúc" htmlFor="wishes" hint="Mỗi đoạn cách nhau bằng một dòng trống."><Textarea id="wishes" rows={8} value={config.wishes.join('\n\n')} onChange={(event) => update('wishes', event.target.value.split(/\n\s*\n/))} /></Field>
          <Field label="Lời kết" htmlFor="final-message"><Textarea id="final-message" rows={3} value={config.finalMessage} onChange={(event) => update('finalMessage', event.target.value)} /></Field>
          <Field label="Thông điệp bí mật" htmlFor="secret-message"><Textarea id="secret-message" rows={3} value={config.secretMessage} onChange={(event) => update('secretMessage', event.target.value)} /></Field>
        </EditorSection>

        <EditorSection title="Giao diện" icon={<Sparkles />}>
          <Field label="Mẫu" htmlFor="theme"><Select value={config.theme} onValueChange={(value) => update('theme', value as BirthdayTemplateId)}><SelectTrigger id="theme" className="creator-select"><SelectValue /></SelectTrigger><SelectContent>{BIRTHDAY_TEMPLATES.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Màu chủ đạo" htmlFor="primary-color"><div className="color-field"><input id="primary-color" type="color" value={config.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} /><Input value={config.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} aria-label="Mã màu chủ đạo" /></div></Field>
        </EditorSection>

        <EditorSection title="Hiệu ứng" icon={<Sparkles />}>
          <EffectRow label="Bóng bay" checked={config.effects.balloons} onChange={(value) => updateEffect('balloons', value)} />
          <EffectRow label="Pháo hoa" checked={config.effects.fireworks} onChange={(value) => updateEffect('fireworks', value)} />
          <EffectRow label="Confetti" checked={config.effects.confetti} onChange={(value) => updateEffect('confetti', value)} />
          <EffectRow label="Cực quang" checked={config.effects.aurora} onChange={(value) => updateEffect('aurora', value)} />
          <EffectRow label="Dải ngân hà ký ức" checked={config.effects.memoryGalaxy} onChange={(value) => updateEffect('memoryGalaxy', value)} />
          <EffectRow label="Hộp quà bí mật" checked={config.effects.giftScene} onChange={(value) => updateEffect('giftScene', value)} />
        </EditorSection>

        <EditorSection title="Âm nhạc" icon={<Music2 />}>
          {config.music ? <div className="music-editor"><div className="music-title"><Music2 /><span><strong>{config.music.name}</strong><small>Nhạc chỉ phát sau thao tác của người xem.</small></span></div><audio controls src={config.music.src} /><div className="volume-row"><Volume2 /><Slider min={0} max={1} step={0.01} value={[config.music.volume]} onValueChange={(value) => setConfig((current) => ({ ...current, music: current.music ? { ...current.music, volume: Array.isArray(value) ? value[0] : value } : null }))} /></div><Button variant="outline" onClick={removeMusic}><Trash2 /> Gỡ nhạc</Button></div> : <Button variant="outline" onClick={() => musicInput.current?.click()}><Music2 /> Chọn một bài nhạc</Button>}
          <input ref={musicInput} className="sr-only" type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4" onChange={(event) => { void handleMusic(event.target.files?.[0]); event.target.value = ''; }} />
        </EditorSection>

        <EditorSection title="Xuất bản" icon={<Share2 />}>
          <p className="publish-copy">Trang đã gửi sẽ luôn dùng bản xuất bản gần nhất. Bạn vẫn có thể tiếp tục sửa bản nháp rồi xuất bản phiên bản mới.</p>
          {!draft.configured ? <p className="setup-note"><CloudOff /> Cần cấu hình Supabase để lưu và xuất bản.</p> : null}
          {publishError ? <p className="creator-error" role="alert">{publishError}</p> : null}
          <Button className="publish-button" size="lg" onClick={() => void publish()} disabled={publishing || !draft.configured}>{publishing ? <LoaderCircle className="spin" /> : <Share2 />}{publishing ? 'Đang xuất bản...' : 'Xuất bản'}</Button>
        </EditorSection>
        {mediaError ? <p className="creator-error sticky-error" role="alert">{mediaError}</p> : null}
      </div>
    </aside>
  );

  const preview = <section className="creator-preview" aria-label="Xem trước trực tiếp"><div className="preview-chrome"><span><i /> Xem trước trực tiếp</span><Button variant="outline" size="sm" onClick={() => { window.sessionStorage.setItem('birthday-creator-preview', JSON.stringify(config)); window.open('/?preview=1', '_blank'); }}><ExternalLink /> Mở rộng</Button></div><div className="preview-stage"><BirthdayExperience config={config} previewMode /></div></section>;

  return (
    <main className="creator-shell">
      {isMobile ? <><Tabs value={mobileTab} onValueChange={(value) => setMobileTab(value as 'edit' | 'preview')} className="creator-mobile-tabs"><TabsList><TabsTrigger value="edit">Chỉnh sửa</TabsTrigger><TabsTrigger value="preview">Xem trước</TabsTrigger></TabsList></Tabs>{mobileTab === 'edit' ? editor : preview}</> : <div className="creator-desktop">{editor}{preview}</div>}

      <Dialog open={Boolean(shareUrl)} onOpenChange={(open) => { if (!open) setShareUrl(null); }}>
        <DialogContent className="share-dialog">
          <DialogHeader><div className="share-success"><Sparkles /></div><DialogTitle>Trang sinh nhật của bạn đã sẵn sàng 🎉</DialogTitle><DialogDescription>Gửi đường link này để người nhận bước vào món quà bạn vừa tạo.</DialogDescription></DialogHeader>
          <div className="share-link"><span>{shareUrl}</span><Button size="icon" onClick={() => void copyShareUrl()} aria-label="Sao chép liên kết">{copied ? <Check /> : <Copy />}</Button></div>
          <DialogFooter className="share-actions"><Button variant="outline" onClick={() => setShareUrl(null)}>Chỉnh sửa tiếp</Button>{typeof navigator !== 'undefined' && typeof (navigator as unknown as { share?: unknown }).share === 'function' ? <Button variant="outline" onClick={() => void share()}><Share2 /> Chia sẻ</Button> : null}<Button onClick={() => window.open(shareUrl ?? '', '_blank')}><Play /> Xem trang</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
