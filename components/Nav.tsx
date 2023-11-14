import AuthButton from '../components/AuthButton'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export default function Nav() {
    const cookieStore = cookies()

    const canInitSupabaseClient = () => {
        // This function is just for the interactive tutorial.
        // Feel free to remove it once you have Supabase connected.
        try {
            createClient(cookieStore)
            return true
        } catch (e) {
            return false
        }
    }

    const isSupabaseConnected = canInitSupabaseClient()

    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full flex justify-end text-sm pr-8">
                {isSupabaseConnected && <AuthButton />}
            </div>
        </nav>
    )
}
