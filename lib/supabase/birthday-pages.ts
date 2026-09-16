import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { BirthdayConfig } from '@/config/birthday';
import { DEFAULT_UNLOCK_TIME_ZONE } from '@/lib/unlock';
import { BIRTHDAY_ASSETS_BUCKET, getPublicSupabaseClient, getSupabaseClient } from './client';

export type BirthdayPageStatus = 'draft' | 'published';

export type BirthdayPage = {
  id: string;
  owner_id: string;
  slug: string | null;
  status: BirthdayPageStatus;
  recipient_name: string;
  title: string;
  template_id: string;
  unlock_at: string | null;
  unlock_timezone: string;
  config: BirthdayConfig;
  published_config: BirthdayConfig | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicBirthday =
  | {
      status: 'locked';
      id: string;
      slug: string;
      recipient_name: string;
      title: string;
      template_id: string;
      unlock_at: string;
      unlock_timezone: string;
      published_at: string | null;
      published_config: null;
    }
  | {
      status: 'open';
      id: string;
      slug: string;
      recipient_name: string;
      title: string;
      template_id: string;
      unlock_at: string | null;
      unlock_timezone: string;
      published_at: string | null;
      published_config: BirthdayConfig;
    };

export type BirthdayWish = {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
};

export type BirthdayWishChange =
  | { type: 'insert'; wish: BirthdayWish }
  | { type: 'remove'; id: string };

function parseBirthdayWish(value: unknown): BirthdayWish | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.author_name !== 'string' || typeof row.message !== 'string' || typeof row.created_at !== 'string') return null;
  return { id: row.id, author_name: row.author_name, message: row.message, created_at: row.created_at };
}

export async function ensureAnonymousUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  if (data.session?.user) return data.session.user;
  const { data: signedIn, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return signedIn.user;
}

export async function createDraft(ownerId: string, config: BirthdayConfig, unlockAt: string | null = null, unlockTimezone = DEFAULT_UNLOCK_TIME_ZONE) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client
    .from('birthday_pages')
    .insert({
      owner_id: ownerId,
      status: 'draft',
      recipient_name: config.recipientName,
      title: config.title,
      template_id: config.theme,
      unlock_at: unlockAt,
      unlock_timezone: unlockTimezone,
      config,
    })
    .select('*')
    .single<BirthdayPage>();
  if (error) throw error;
  return data;
}

export async function saveDraft(pageId: string, config: BirthdayConfig, unlockAt: string | null = null, unlockTimezone = DEFAULT_UNLOCK_TIME_ZONE) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { error } = await client
    .from('birthday_pages')
    .update({
      recipient_name: config.recipientName,
      title: config.title,
      template_id: config.theme,
      unlock_at: unlockAt,
      unlock_timezone: unlockTimezone,
      config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);
  if (error) throw error;
}

export async function publishBirthdayPage(pageId: string, config: BirthdayConfig, unlockAt: string | null = null, unlockTimezone = DEFAULT_UNLOCK_TIME_ZONE) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.rpc('publish_birthday_page', {
    page_uuid: pageId,
    config_snapshot: config,
    unlock_timestamp: unlockAt,
    unlock_zone: unlockTimezone,
  });
  if (error) throw error;
  return data as string;
}

export async function getPublishedBirthday(slug: string): Promise<PublicBirthday | null> {
  const client = getPublicSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.rpc('get_published_birthday', { page_slug: slug });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const metadata = {
    id: String(row.id),
    slug: String(row.slug),
    recipient_name: String(row.recipient_name),
    title: String(row.title),
    template_id: String(row.template_id),
    unlock_at: row.unlock_at ? String(row.unlock_at) : null,
    unlock_timezone: row.unlock_timezone ? String(row.unlock_timezone) : DEFAULT_UNLOCK_TIME_ZONE,
    published_at: row.published_at ? String(row.published_at) : null,
  };
  if (row.unlock_status === 'LOCKED' || !row.published_config) {
    if (!metadata.unlock_at) return null;
    return { ...metadata, status: 'locked', unlock_at: metadata.unlock_at, published_config: null };
  }
  return { ...metadata, status: 'open', published_config: await resolveAssetUrls(row.published_config as BirthdayConfig, client) };
}

export async function getBirthdayWishes(slug: string): Promise<BirthdayWish[]> {
  const client = getPublicSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.rpc('get_published_birthday_wishes', { p_birthday_slug: slug });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return rows.map(parseBirthdayWish).filter((wish): wish is BirthdayWish => Boolean(wish));
}

export async function submitBirthdayWish(slug: string, authorName: string, message: string, visitorId: string | null = null): Promise<BirthdayWish> {
  const client = getPublicSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.rpc('submit_birthday_wish', {
    p_birthday_slug: slug,
    p_author_name: authorName,
    p_message: message,
    p_visitor_id: visitorId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const wish = parseBirthdayWish(row);
  if (!wish) throw new Error('Lời chúc trả về không hợp lệ.');
  return wish;
}

export function subscribeToBirthdayWishes(birthdayId: string, onChange: (change: BirthdayWishChange) => void) {
  const client = getPublicSupabaseClient();
  if (!client) return () => undefined;
  const channel = client
    .channel(`birthday-wishes:${birthdayId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'birthday_wishes', filter: `birthday_id=eq.${birthdayId}` }, (payload) => {
      const row = payload.new as Record<string, unknown>;
      if (payload.eventType === 'DELETE') {
        const id = typeof payload.old?.id === 'string' ? payload.old.id : null;
        if (id) onChange({ type: 'remove', id });
        return;
      }
      const wish = parseBirthdayWish(row);
      if (!wish) return;
      if (payload.eventType === 'UPDATE' && row.status !== 'VISIBLE') {
        onChange({ type: 'remove', id: wish.id });
      } else {
        onChange({ type: 'insert', wish });
      }
    })
    .subscribe();
  return () => { void client.removeChannel(channel); };
}

export async function listOwnedBirthdays() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('birthday_pages')
    .select('id,slug,status,recipient_name,title,template_id,unlock_at,unlock_timezone,config,published_at,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function duplicateBirthdayPage(page: BirthdayPage) {
  const user = await ensureAnonymousUser();
  if (!user) throw new Error('Không thể xác định chủ sở hữu.');
  return createDraft(user.id, {
    ...structuredClone(page.config),
    recipientName: `${page.config.recipientName} (bản sao)`,
  });
}

export async function deleteBirthdayPage(page: BirthdayPage) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const paths = [
    ...page.config.memories.map((memory) => memory.storagePath),
    page.config.music?.storagePath,
    ...page.published_config?.memories.map((memory) => memory.storagePath) ?? [],
    page.published_config?.music?.storagePath,
  ].filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await client.storage.from(BIRTHDAY_ASSETS_BUCKET).remove([...new Set(paths)]);
    if (storageError) throw storageError;
  }
  const { error } = await client.from('birthday_pages').delete().eq('id', page.id);
  if (error) throw error;
}

export async function resolveAssetUrls(config: BirthdayConfig, suppliedClient?: SupabaseClient) {
  const client = suppliedClient ?? getSupabaseClient();
  if (!client) return config;
  const paths = [
    ...config.memories.map((memory) => memory.storagePath),
    config.music?.storagePath,
  ].filter((path): path is string => Boolean(path));
  if (!paths.length) return config;
  const signed = await Promise.all(paths.map(async (path) => {
    const { data } = await client.storage.from(BIRTHDAY_ASSETS_BUCKET).createSignedUrl(path, 60 * 60);
    return [path, data?.signedUrl] as const;
  }));
  const urls = new Map(signed.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
  return {
    ...config,
    memories: config.memories.map((memory) => memory.storagePath && urls.has(memory.storagePath)
      ? { ...memory, src: urls.get(memory.storagePath)! }
      : memory),
    music: config.music?.storagePath && urls.has(config.music.storagePath)
      ? { ...config.music, src: urls.get(config.music.storagePath)! }
      : config.music,
  };
}

export async function uploadBirthdayAsset(options: {
  userId: string;
  pageId: string;
  folder: 'photos' | 'music';
  file: File;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const safeName = options.file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = `${options.userId}/${options.pageId}/${options.folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from(BIRTHDAY_ASSETS_BUCKET).upload(path, options.file, {
    cacheControl: '31536000',
    contentType: options.file.type,
  });
  if (error) throw error;
  const { data, error: signError } = await client.storage.from(BIRTHDAY_ASSETS_BUCKET).createSignedUrl(path, 60 * 60);
  if (signError) throw signError;
  return { path, signedUrl: data.signedUrl };
}

export async function deleteBirthdayAsset(path: string) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.storage.from(BIRTHDAY_ASSETS_BUCKET).remove([path]);
  if (error) throw error;
}
