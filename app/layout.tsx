import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const heading = Cormorant_Garamond({ variable: '--font-heading', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], display: 'swap' });
const body = Manrope({ variable: '--font-body', subsets: ['latin', 'vietnamese'], display: 'swap' });
const title = 'Birthday Website Creator';
const description = 'Tạo một trang sinh nhật 3D thật riêng, xem trước tức thì và gửi bằng một đường link.';

export const metadata: Metadata = {
  metadataBase: new URL('https://birthday-midnight-wish.phophoccode.chatgpt.site'),
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: { title, description, type: 'website', locale: 'vi_VN' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className="dark" suppressHydrationWarning><body suppressHydrationWarning className={`${heading.variable} ${body.variable}`}>{children}</body></html>;
}
