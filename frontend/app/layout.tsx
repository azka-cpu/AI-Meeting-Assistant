/**
 
 *
 * This is now the MINIMAL root layout — just html/body + the
 * Caveat font. It does NOT render the Sidebar anymore. The Sidebar
 * moves into app/(app)/layout.tsx so it only wraps authenticated
 * pages (dashboard, meetings, calendar, etc.) and NOT /login or
 * /register.
 */

import type { Metadata } from 'next';
import { Caveat } from 'next/font/google';
import './globals.css';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-handwritten',
});

export const metadata: Metadata = {
  title: 'MeetMate AI - AI Meeting Assistant',
  description: 'Your AI-powered meeting and voice assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={caveat.variable}>
      <body>{children}</body>
    </html>
  );
}
