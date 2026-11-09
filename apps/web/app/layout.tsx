import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Alam's Frame — Personal Family Cinema",
  description:
    'A private Google Drive-powered television media platform. Your family memories, on the big screen.',
  manifest: '/manifest.json',
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
      <body className="min-h-[100dvh] bg-[#101113] text-[#F5F5F2] antialiased selection:bg-[#D8C6A1]/20 selection:text-[#F5F5F2]">
        {children}
      </body>
    </html>
  );
}
