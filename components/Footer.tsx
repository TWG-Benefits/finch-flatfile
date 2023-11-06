export default function Footer() {
    return (
        <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
            <p>
                Powered by{' '}
                <a
                    href="https://www.tryfinch.com/?utm_source=retirement-app&utm_medium=template&utm_term=retirement"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                >
                    Finch
                </a>
            </p>
        </footer>
    )
}
