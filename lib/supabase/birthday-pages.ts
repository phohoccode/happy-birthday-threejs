import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { BirthdayConfig } from '@/config/birthday';
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
  config: BirthdayConfig;
  published_config: BirthdayConfig | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureAnonymousUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  if (data.session?.user) return data.session.user;
  const { data: signedIn, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return signedIn.user;
}

export async function createDraft(ownerId: string, config: BirthdayConfig) {
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
      config,
    })
    .select('*')
    .single<BirthdayPage>();
  if (error) throw error;
  return data;
}

export async function saveDraft(pageId: string, config: BirthdayConfig) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { error } = await client
    .from('birthday_pages')
    .update({
      recipient_name: config.recipientName,
      title: config.title,
      template_id: config.theme,
      config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);
  if (error) throw error;
}

export async function publishBirthdayPage(pageId: string, config: BirthdayConfig) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.rpc('publish_birthday_page', {
    page_uuid: pageId,
    config_snapshot: config,
  });
  if (error) throw error;
  return data as string;
}

export async function getPublishedBirthday(slug: string) {
  const client = getPublicSupabaseClient();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client
    .from('birthday_pages')
    .select('id,slug,recipient_name,title,template_id,published_config,published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<Pick<BirthdayPage, 'id' | 'slug' | 'recipient_name' | 'title' | 'template_id' | 'published_config' | 'published_at'>>();
  if (error) throw error;
  if (!data?.published_config) return null;
  return { ...data, published_config: await resolveAssetUrls(data.published_config, client) };
}

export async function listOwnedBirthdays() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('birthday_pages')
    .select('id,slug,status,recipient_name,title,template_id,config,published_at,created_at,updated_at')
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
