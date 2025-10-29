import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weaver Workflow Server',
  description: 'Knowledge graph workflow automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
