import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { baseUrl } from '@/utils/constants'

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Finch Flatfile',
  description: 'The fastest way to integrate with employers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" >
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          <Nav />

          {children}

          <Footer />
        </main>
      </body>
    </html>
  )
}
