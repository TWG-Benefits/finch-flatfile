import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';



export default async function handleNewDataSync(company_id: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.from("connections").select().eq('company_id', company_id)

    if (error) {
        console.log(error)
        throw new Error(error?.message)
    }

    const token = data[0].finch_access_token


    const finch = new Finch({
        accessToken: token
    })

    // pull most recent pay statement from finch
    // retrieve last-processed-paymentId from db
    // if newest paymentId does not equal last-processed-paymentId, process new payroll

}
