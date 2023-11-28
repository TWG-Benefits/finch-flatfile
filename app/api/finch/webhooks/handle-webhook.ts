import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment, { Moment } from 'moment'
import { createSFTPClient } from '@/utils/sftp';
import { Connection, Customer } from '@/types/database';
import convertFileToCSV from './convert-file-to-CSV';
import processPayment from './process-payment';
import { getFinchData, validateFinchData } from './finch';

// yyyy-mm-dd, including leap years
const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/

type PayData = {
    payment_id: string,
    pay_date: string | null,
    pay_statements: FinchIndividualPayStatement[]
}

async function handleNewPayment(companyId: string, paymentId: string, payDate: string): Promise<boolean> {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // get all connections for this company
    const { data: connections, error: connErr } = await supabase.from("connections").select().eq('company_id', companyId)
    if (!connections || connErr) {
        console.log(connErr)
        return false
    }

    // only get the newest connection (if there are multiple for this company)
    const connection: Connection = connections[connections.length - 1]

    // get the customer for this connection
    const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', connection.customer_id).single()
    if (!customer || custErr) {
        console.log(custErr)
        return false
    }

    console.log(`CUSTOMER: ${customer?.customer_name}`)
    console.log("CONNECTION")
    console.log(connection)

    const token = connection.finch_access_token
    const finchData = await getFinchData(token, paymentId)
    const finch = validateFinchData(finchData)

    if (!finch.success || !finch.data)
        return false

    // Process the Finch data and map them into the fields the customer requires
    const file = processPayment(customer.plan_id, finch.data)
    const csv = convertFileToCSV(file)

    const status = await sendCSV(csv, customer.customer_name, connection.provider_id, customer.plan_id, payDate)

    return status
}

async function handleNewDataSync(companyId: string) {
    // call /jobs
    // sort by created_at to get first job
    // only continue if first job
    // get historical data
    // process
    // convert
    // send
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

async function handleAccountUpdated(event: AccountUpdateWebhook): Promise<boolean> {
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

export default { handleNewPayment, handleAccountUpdated, handleTestWebhook }

function getAllNewPayments(payments: FinchPayment[], lastProcessedPaymentId: string): PayData[] {
    let foundLastProcessed = false;

    // Assuming that if lastProcessedPaymentId is not found, all payments are new
    if (!payments.some(payment => payment.id === lastProcessedPaymentId)) {
        foundLastProcessed = true;
    }

    const results: PayData[] = [];

    for (const payment of payments) {
        if (foundLastProcessed) {
            results.push({
                payment_id: payment.id,
                pay_date: payment.pay_date,
                pay_statements: [] // we will add this later once we call the /pay-statements endpoint
            });
        }

        if (payment.id === lastProcessedPaymentId) {
            foundLastProcessed = true;
        }
    }

    return results;
}

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


