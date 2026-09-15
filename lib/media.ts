const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']);

export function validateImage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!IMAGE_TYPES.has(file.type)) return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.';
  if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'Phần mở rộng ảnh không hợp lệ.';
  if (file.size > 10 * 1024 * 1024) return 'Mỗi ảnh phải nhỏ hơn 10 MB.';
  return null;
}

export function validateAudio(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!AUDIO_TYPES.has(file.type)) return 'Chỉ hỗ trợ MP3, WAV, OGG hoặc M4A.';
  if (!extension || !['mp3', 'wav', 'ogg', 'm4a', 'mp4'].includes(extension)) return 'Phần mở rộng tệp nhạc không hợp lệ.';
  if (file.size > 20 * 1024 * 1024) return 'Tệp nhạc phải nhỏ hơn 20 MB.';
  return null;
}

export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/png' && file.size < 1.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!blob || blob.size >= file.size) return file;
  const base = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${base}.webp`, { type: 'image/webp' });
}
