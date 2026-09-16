'use client';

import { MessageCircleHeart, Send, Sparkles } from 'lucide-react';
import { useId, useState, type ComponentProps, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { BirthdayWish } from '@/lib/supabase/birthday-pages';

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0];

function formatWishDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export function GuestBookSection({ name, wishes, loading, error, submit, isPreview, showAuthor, cooldownMs, sectionRef, selectedWish, onSelectWish }: {
  name: string;
  wishes: readonly BirthdayWish[];
  loading: boolean;
  error: string | null;
  submit: (authorName: string, message: string) => Promise<BirthdayWish>;
  isPreview: boolean;
  showAuthor: boolean;
  cooldownMs: number;
  sectionRef: RefObject<HTMLElement | null>;
  selectedWish: BirthdayWish | null;
  onSelectWish: (wish: BirthdayWish | null) => void;
}) {
  const nameId = useId();
  const messageId = useId();
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cooldownActive = cooldownMs > 0;
  const trimmedName = authorName.trim();
  const trimmedMessage = message.trim();
  const valid = trimmedName.length >= 1 && trimmedName.length <= 40 && trimmedMessage.length >= 1 && trimmedMessage.length <= 500;

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    if (!valid || submitting || cooldownActive) return;
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      await submit(trimmedName, trimmedMessage);
      setMessage('');
      setSuccessMessage('Lời chúc của bạn đã trở thành một ngôi sao ✨');
    } catch {
      setFormError('Không thể gửi lời chúc lúc này. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="guest-book-section content-section" data-cinematic-scene="finale" aria-labelledby="guest-book-title">
      <div className="guest-book-shell">
        <div className="guest-book-heading">
          <span className="guest-book-kicker"><Sparkles aria-hidden="true" /> WISH GALAXY</span>
          <h2 id="guest-book-title">Gửi một điều thật đẹp ✨</h2>
          <p>Để lại một lời chúc cho {name}. Mỗi lời chúc sẽ trở thành một ngôi sao trên bầu trời này.</p>
        </div>

        <div className="guest-book-layout">
          <form className="guest-book-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className="guest-book-field">
              <label htmlFor={nameId}>Tên của bạn</label>
              <input id={nameId} value={authorName} maxLength={40} autoComplete="name" onChange={(event) => setAuthorName(event.target.value)} placeholder="Minh" aria-describedby={`${nameId}-hint`} />
              <small id={`${nameId}-hint`}>Tên sẽ xuất hiện bên cạnh ngôi sao của bạn.</small>
            </div>
            <div className="guest-book-field">
              <label htmlFor={messageId}>Lời chúc</label>
              <textarea id={messageId} value={message} maxLength={500} rows={5} onChange={(event) => setMessage(event.target.value)} placeholder="Tuổi mới thật nhiều niềm vui..." aria-describedby={`${messageId}-counter`} />
              <small id={`${messageId}-counter`} className={message.length > 450 ? 'is-near-limit' : undefined}>{message.length} / 500</small>
            </div>
            <p className="guest-book-privacy">Lời chúc của bạn sẽ được hiển thị trên trang này.</p>
            {formError ? <p className="guest-book-error" role="alert">{formError}</p> : null}
            {successMessage ? <p className="guest-book-success" aria-live="polite">{successMessage}</p> : null}
            {cooldownActive ? <output className="guest-book-cooldown">Bạn có thể gửi lời chúc tiếp theo sau {Math.ceil(cooldownMs / 1000)} giây.</output> : null}
            <Button className="guest-book-submit" size="lg" type="submit" disabled={!valid || submitting || cooldownActive}>{submitting ? <MessageCircleHeart className="spin" /> : <Send />}{submitting ? 'Đang gửi...' : 'Gửi lời chúc'}</Button>
          </form>

          <div className="guest-book-galaxy-copy" aria-live="polite">
            <div className="guest-book-orbit" aria-hidden="true"><i /><i /><i /><span><Sparkles /></span></div>
            <strong>{wishes.length ? `${wishes.length} lời chúc đã thắp sáng bầu trời` : 'Bầu trời này đang chờ ngôi sao đầu tiên ✨'}</strong>
            <p>{isPreview ? 'Bản xem trước đang dùng những lời chúc mẫu — không tạo dữ liệu trong Supabase.' : loading ? 'Đang gọi những vì sao về đây...' : error ? 'Sổ lời chúc tạm thời chưa thể kết nối.' : 'Mỗi người để lại một chút ánh sáng ở đây.'}</p>
          </div>
        </div>

        <div className="guest-book-list-wrap">
          <div className="guest-book-list-heading"><span><MessageCircleHeart aria-hidden="true" /> Những người yêu quý {name} đã để lại ánh sáng</span><small>Chạm vào một ngôi sao để đọc lời chúc</small></div>
          {loading ? <p className="guest-book-list-loading">Đang mở bản đồ các vì sao...</p> : null}
          {!loading && !wishes.length ? <p className="guest-book-empty">Bầu trời này đang chờ ngôi sao đầu tiên ✨</p> : null}
          {wishes.length ? <ul className="wish-accessible-list">{wishes.map((wish) => <li key={wish.id}><button type="button" onClick={() => onSelectWish(wish)}><span>“{wish.message}”</span>{showAuthor ? <small>— {wish.author_name}</small> : null}</button></li>)}</ul> : null}
        </div>
      </div>

      <Dialog open={selectedWish !== null} onOpenChange={(open) => { if (!open) onSelectWish(null); }}>
        {selectedWish ? <DialogContent className="wish-detail-dialog">
          <DialogTitle><Sparkles aria-hidden="true" /> Lời chúc từ {showAuthor ? selectedWish.author_name : 'một người thương'}</DialogTitle>
          <DialogDescription className="wish-detail-copy"><span>“{selectedWish.message}”</span>{showAuthor ? <strong>— {selectedWish.author_name}</strong> : null}<time dateTime={selectedWish.created_at}>{formatWishDate(selectedWish.created_at)}</time></DialogDescription>
        </DialogContent> : null}
      </Dialog>
    </section>
  );
}
