import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Customers() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: connections } = await supabase.from('customers').select(`
    customer_name,
    plan_id,
    finch_connect_url
    `)

    console.log(connections)

    return <pre>{JSON.stringify(connections, null, 2)}</pre>
}
