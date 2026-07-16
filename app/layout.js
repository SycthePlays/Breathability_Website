import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
