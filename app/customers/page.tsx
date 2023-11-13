import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Customers() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: customers } = await supabase.from('customers').select(`
    customer_name,
    plan_id,
    finch_connect_url
    `)

    console.log(customers)

    return <pre>{JSON.stringify(customers, null, 2)}</pre>
}
