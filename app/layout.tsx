import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const defaultUrl = process.env.BASE_URL
  ? `${process.env.BASE_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Finch Retirement App',
  description: 'The fastest way to connect sponsors',
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
