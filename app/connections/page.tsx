import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: connections } = await supabase.from('connections').select()

    return <pre>{JSON.stringify(connections, null, 2)}</pre>
}
