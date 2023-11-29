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
    const csv = convertFileToCSV(file)

    const result = await sendCSV(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, webhook.data.pay_date)

    return result
}

async function handleNewDataSync(webhook: DataSyncAllWebhook) {
    const { status, data } = await getCustomerAndConnectionFromDB(webhook.company_id)

    if (!status || !data)
        return false

    const token = data.connection.finch_access_token

    fetch(`${finchApiUrl}/jobs/automated`, {
        method: 'GET',
        headers: {
            'Authorization': token,
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
            // Compare the first data sync job_id with the webhook's job_id to find a match
            if (firstDataSyncJob.job_id == webhook.data.job_id) {
                if (firstDataSyncJob.status === 'complete') {
                    console.log('first_data_sync_job_id: ' + firstDataSyncJob.job_id);
                    const finchData = await getFinchData(token)
                    const finch = validateFinchData(finchData)

                    if (!finch.success || !finch.data)
                        return false

                    // Process the Finch data and map them into the fields the customer requires
                    const file = processPayments(data.customer.plan_id, finch.data)
                    const csv = convertFileToCSV(file)

                    const result = await sendCSV(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, moment().format("YYYY-MM-DD"))

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

// async function handleNewDataSync(companyId: string) {
//     const cookieStore = cookies()
//     const supabase = createClient(cookieStore);

//     // get all connections for this company
//     const { data: connection, error: connErr } = await supabase.from("connections").select().eq('company_id', companyId)
//     if (!connection || connErr) {
//         console.log(connErr)
//         return
//         //throw new Error(connErr?.message)
//     }

//     // only get the newest connection (if there are multiple for this company)
//     const newestConnection: Connection = connection[connection.length - 1]

//     const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', newestConnection.customer_id).single()
//     if (!customer || custErr) {
//         console.log(custErr)
//         return
//         //throw new Error(custErr?.message)
//     }

//     console.log(`CUSTOMER: ${customer?.customer_name}`)
//     console.log("CONNECTION")
//     console.log(newestConnection)

//     const token = newestConnection.finch_access_token
//     let lastProcessedPaymentId = newestConnection.last_processed_payment

//     // Init Finch SDK
//     const finch = new Finch({
//         accessToken: token
//     })

//     const now = moment()
//     const endDate = now.format("YYYY-MM-DD")
//     const startDate = moment().subtract(3, 'months').format("YYYY-MM-DD")
//     const startYear = moment().startOf("year").format("YYYY-MM-DD");

//     if (!startDate.match(dateRegex) || !endDate.match(dateRegex) || !startYear.match(dateRegex)) {
//         console.log("error: improper date format")
//         return
//     }

//     // get year to date payments from Finch
//     const initYtdPayments = (await finch.hris.payments.list({ start_date: startYear, end_date: endDate })).items as FinchPayment[]


//     // if this is a new connection, lastProcessedPaymentId will be null
//     if (lastProcessedPaymentId == null) {
//         // set the lastProcessedPaymentId to 2 pay cycles ago in order to get some historical data
//         lastProcessedPaymentId = initYtdPayments[initYtdPayments.length - 3].id as UUID
//         console.log(lastProcessedPaymentId)
//         // but write the newest (i.e. the last) paymentId to the database
//         const { error } = await supabase.from("connections").update({ last_processed_payment: initYtdPayments[initYtdPayments.length - 1].id }).eq('id', newestConnection.id)

//         if (error)
//             console.log(error)
//     }

//     const newPayments = getAllNewPayments(initYtdPayments, lastProcessedPaymentId)

//     // if no new pay statements (empty array), then don't create file
//     if (!newPayments.length) {
//         console.log(`No new pay statements for company ${customer.customer_name}`)
//         return
//     }

//     // NEW: get the Finch pay statements for all new payments
//     const newPayStatements = (await finch.hris.payStatements.retrieveMany({
//         requests: newPayments.map(payment => {
//             return { payment_id: payment.payment_id }
//         })
//     })).responses as FinchPayStatementRes[]

//     // YTD: get the Finch pay statements for all year to date payments
//     const ytdPayments: PayData[] = initYtdPayments.map(payment => {
//         return {
//             payment_id: payment.id,
//             pay_date: payment.pay_date,
//             pay_statements: []
//         }
//     })
//     const ytdPayStatements = (await finch.hris.payStatements.retrieveMany({
//         requests: ytdPayments.map(payment => {
//             return { payment_id: payment.payment_id }
//         })
//     })).responses as FinchPayStatementRes[]

//     // TODO: Validate that all payment ids in ytdPayments exist in ytdPayStatements. don't want that being wrong

//     // For each pay-statement, match the individual pay-statements with the payment details
//     newPayStatements.forEach(response => {
//         var payment = newPayments.find(payment => payment.payment_id === response.payment_id)
//         if (payment)
//             payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
//     })
//     ytdPayStatements.forEach(response => {
//         var payment = ytdPayments.find(payment => payment.payment_id === response.payment_id)
//         if (payment)
//             payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
//     })

//     // get the company directory from Finch
//     const individuals = (await finch.hris.directory.list()).individuals as FinchEmployee[]

//     const csv = convertPayrollToFile(individuals, newPayments, ytdPayments)

//     try {
//         const sftpClient = createSFTPClient()
//         await sftpClient.putCSV(csv, `/${customer.customer_name}/finch-${companyId}-${newestConnection.provider_id}-payroll-${moment().format('YYYY-MM-DD')}.csv`); // could include payDate if broken out by each file
//         console.log('File uploaded via SFTP successfully');
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// }

async function handleAccountUpdated(webhook: AccountUpdateWebhook): Promise<boolean> {
    return true
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
        const sftpClient = createSFTPClient()
        const status = await sendCSV(csv, "TESTING", "test", 123, moment().format("YYYY-MM-DD"))
        console.log('File uploaded via SFTP successfully');
        return status
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

export default { handleNewPayment, handleNewDataSync, handleAccountUpdated, handleTestWebhook }

async function sendCSV(csv: string, customerName: string, providerId: string, planId: number, payDate: string): Promise<boolean> {
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

