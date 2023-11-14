import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Customers() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: customers } = await supabase.from('customers').select(`
    customer_name,
    plan_id,
    finch_connect_url
    `)

    //console.log(customers)

    return (
        <div className="flex-1 flex flex-col px-8 w-full my-20 gap-2 ">
            <Link
                href="/"
                className="absolute left-8 top-4 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>{' '}
                Back
            </Link>

            <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(customers, null, 2)}</pre>

        </div>
    )
}
