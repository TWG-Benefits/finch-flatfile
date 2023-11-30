import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment, { Moment } from 'moment'
import { createSFTPClient } from '@/utils/sftp';
import { Connection, Customer } from '@/types/database';
import convertFileToCSV from './convert-file-to-CSV';
import processPayments from './process-payment';
import { getFinchData, validateFinchData } from './finch';
import { finchApiUrl } from '@/utils/constants';


async function handleNewPayment(webhook: PaymentWebhook): Promise<boolean> {

    const { status, data } = await getCustomerAndConnectionFromDB(webhook.company_id)

    if (!status || !data)
        return false

    const token = data.connection.finch_access_token
    const finchData = await getFinchData(token, webhook.data.payment_id)
    const finch = validateFinchData(finchData)

    if (!finch.success || !finch.data)
        return false

    // Process the Finch data and map them into the fields the customer requires
    const file = processPayments(data.customer.plan_id, finch.data)
    const csv = convertFileToCSV(file, finch.data.dataRefreshDate)

    const result = await sendFileViaSFTP(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, webhook.data.pay_date)

    return result
}

async function handleNewDataSync(webhook: DataSyncAllWebhook) {
    const { status, data } = await getCustomerAndConnectionFromDB(webhook.company_id)

    if (!status || !data)
        return false

    const token = data.connection.finch_access_token

    console.log("GET /jobs/automated")
    await fetch(`${finchApiUrl}/jobs/automated`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Finch-API-Version': '2020-09-17'
        }
    })
        .then(response => response.json()) // assuming the response is JSON
        .then((response: FinchAutomatedJobsResponse) => {
            // Sort the jobs by 'created_at' date in ascending order
            const sortedJobs = response.data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            // Return the first data sync job for the company
            return sortedJobs[0];
        })
        .then(async (firstDataSyncJob: FinchJob) => {
            console.log(firstDataSyncJob)
            // Compare the first data sync job_id with the webhook's job_id to find a match
            if (firstDataSyncJob.job_id == webhook.data.job_id) {
                if (firstDataSyncJob.status === 'complete') {
                    console.log('first_data_sync_job_id: ' + firstDataSyncJob.job_id);
                    const finchData = await getFinchData(token)
                    const finch = validateFinchData(finchData)

                    if (!finch.success || !finch.data)
                        return false

                    //console.log(JSON.stringify(finch.data.individuals, null, 2));

                    // Process the Finch data and map them into the fields the customer requires
                    const file = processPayments(data.customer.plan_id, finch.data)
                    const csv = convertFileToCSV(file, finch.data.dataRefreshDate)

                    const result = await sendFileViaSFTP(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, moment().format("YYYY-MM-DD"))
                    return result
                }
            }

            console.log('Data sync job_id did not match webhook job_id')
            return false
        })
        .catch(error => {
            console.error('Error:', error);
            return false
        });


}

async function handleAccountUpdated(webhook: AccountUpdateWebhook): Promise<boolean> {
    return false
}

async function handleTestWebhook(): Promise<boolean> {
    const csv = `
    ID,Name,Department
    1,John Doe,Finance
    2,Jane Smith,Marketing
    3,Emily Johnson,Human Resources
    4,Michael Brown,IT
    `

    try {
        const status = await sendFileViaSFTP(csv, "TESTING", "test", 123, moment().format("YYYY-MM-DD"))
        console.log('File uploaded via SFTP successfully');
        return status
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

export default { handleNewPayment, handleNewDataSync, handleAccountUpdated, handleTestWebhook }

async function sendFileViaSFTP(csv: string, customerName: string, providerId: string, planId: number, payDate: string): Promise<boolean> {
    console.log(`Attempting to send file via SFTP`)
    try {
        const sftpClient = createSFTPClient()
        await sftpClient.putCSV(csv, `/${customerName}/finch-${planId}-${providerId}-${payDate}.csv`);
        console.log('File uploaded via SFTP successfully');
        return true
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

type CustomerConnection = {
    status: boolean,
    data: {
        customer: Customer;
        connection: Connection
    } | null
}
async function getCustomerAndConnectionFromDB(companyId: string): Promise<CustomerConnection> {
    console.log("Getting company and connection details from db")

    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // get all connections for this company
    const { data: connections, error: connErr } = await supabase.from("connections").select().eq('company_id', companyId)
    if (!connections || connErr) {
        console.log(connErr)
        return { status: false, data: null }
    }

    // only get the newest connection (if there are multiple for this company)
    const connection: Connection = connections[connections.length - 1]

    // get the customer for this connection
    const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', connection.customer_id).single()
    if (!customer || custErr) {
        console.log(custErr)
        return { status: false, data: null }
    }

    console.log(`CUSTOMER: ${customer?.customer_name}`)
    console.log("CONNECTION")
    console.log(connection)

    return { status: true, data: { customer, connection } }
}
