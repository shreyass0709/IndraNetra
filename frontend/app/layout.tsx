import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';
import { copy } from '../lib/copy';

// One font family for the whole app. The old build loaded Geist Sans and Geist Mono
// but wired neither into Tailwind, so every screen actually rendered in the default
// system stack -- while `font-mono` utilities pulled the mono face in for UI labels,
// which is what gave the app its terminal look. Inter is now mapped to `font-sans`
// in globals.css, and monospace is reserved for RTSP URLs and coordinates.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: copy.app.name,
  description: copy.app.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set in frontend/.env.local. No hardcoded fallback: a client id baked into
  // source is one more value that silently rots when it changes.
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Apply the saved theme before first paint so there is no light-to-dark
            flash. ThemeToggle keeps localStorage['theme'] in sync after this runs. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
      </body>
    </html>
  );
}
