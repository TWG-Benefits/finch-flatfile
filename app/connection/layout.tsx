import { baseUrl } from '@/utils/constants'
import '../globals.css'
import Footer from '@/components/Footer'

export const metadata = {
    metadataBase: new URL(baseUrl),
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

                    {children}

                    <Footer />
                </main>
            </body>
        </html>
    )
}
