import Finch from '@tryfinch/finch-api';
import database from '@/app/util/database'




export default async function handleNewDataSync(company_id: string) {
    const finch = new Finch({
        accessToken: '' // pull from db
    })
    // pull most recent pay statement from finch
    // retrieve last-processed-paymentId from db
    // if newest paymentId does not equal last-processed-paymentId, process new payroll

}
