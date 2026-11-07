import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DriveFrame TV — Your Google Drive on Television',
  description:
    'Turn your Google Drive into a private, television-friendly digital photo gallery and cinematic ambient frame.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] bg-[#09090b] text-stone-100 antialiased selection:bg-amber-400 selection:text-zinc-950">
        {children}
      </body>
    </html>
  );
}
