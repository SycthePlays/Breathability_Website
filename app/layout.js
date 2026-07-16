import './globals.css';

export const metadata = {
  title: 'Breathability',
  description: 'Find the route with the freshest air in Jakarta.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
