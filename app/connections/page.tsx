import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Connections() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: connections } = await supabase.from('connections').select(`
    customer_id,
    company_id,
    provider_id,
    account_id,
    created_at
    `)

    console.log(connections)

    return <pre>{JSON.stringify(connections, null, 2)}</pre>
}
