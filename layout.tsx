// app/layout.tsx
export const metadata = {
  title: 'StyleForge Platform',
  description: 'A platform for fashion industry stakeholders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
