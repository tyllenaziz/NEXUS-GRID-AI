import type { Metadata } from "next";
import "./globals.css";
import { API_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: "NexusGrid | Train AI. Get Paid.",
  description: "The complete AI training and human data platform.",
  icons: {
    icon: '/icon.png', // This links to your icon.png file
    apple: '/icon.png', // Optional: used for iPhone home screen icons
  },
};

// Runs before React hydrates. Reads the saved theme and applies the
// `dark` class to <html> immediately, so there's no flash of the wrong
// theme on load / refresh.
const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('nexus-theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}