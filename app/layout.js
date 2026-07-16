import './globals.css';
import { Inter } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Breathability',
  description: 'Find the route with the freshest air in Jakarta.',
};

// Explicit viewport config (Next 14 split this out of `metadata`). Pinch
// zoom is intentionally left enabled — capping maximumScale is a common
// mobile mistake that breaks accessibility for anyone who needs to zoom.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${inter.variable}`}>
      <head>
        {/* Material Symbols has no next/font/google entry — plain link tag. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
