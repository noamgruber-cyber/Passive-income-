// Root layout — minimal shell required by Next.js.
// The real layout (with locale, Navbar, NextIntlClientProvider) lives in app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
