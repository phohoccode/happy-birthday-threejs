import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { birthdayConfig } from '@/config/birthday';
import './globals.css';

const heading = Cormorant_Garamond({ variable: '--font-heading', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], display: 'swap' });
const body = Manrope({ variable: '--font-body', subsets: ['latin', 'vietnamese'], display: 'swap' });
const title = `Happy Birthday ${birthdayConfig.name} 🎂`;
const description = `A little birthday surprise made especially for ${birthdayConfig.name}.`;

export const metadata: Metadata = {
  metadataBase: new URL('https://birthday-midnight-wish.super-hill-7530.chatgpt.site'),
  title,
  description,
  robots: { index: false, follow: false },
  openGraph: { title, description, type: 'website', locale: 'vi_VN' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className="dark" suppressHydrationWarning><body suppressHydrationWarning className={`${heading.variable} ${body.variable}`}>{children}</body></html>;
}
