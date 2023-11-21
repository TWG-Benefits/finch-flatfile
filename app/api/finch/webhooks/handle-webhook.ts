import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment, { Moment } from 'moment'
import { createSFTPClient } from '@/utils/sftp';
import { Connection, Customer } from '@/types/database';
import { UUID } from 'crypto';
import convertPayrollToFile from './convert-payroll-to-file';
import { NextResponse } from 'next/server';
import convertPayStatementToFile from './convert-paystatement-to-file';

const sftpPath = process.env.SFTP_PATH

// yyyy-mm-dd, including leap years
const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/

type FinchDirectoryRes = {
    paging: {
        count: number
        offset: number
    },
    individuals: FinchEmployee[]
}
type FinchPayStatementsRes = {
    responses: FinchPayStatementRes
}
type FinchPayStatementRes = {
    payment_id: string,
    code: number,
    body: {
        paging: {
            count: number,
            offset: number
        },
        pay_statements: FinchPayStatement[]
    }
}
type PayData = {
    payment_id: string,
    pay_date: string | null,
    pay_statements: FinchPayStatement[]
}

async function handleNewPayment(company_id: string, payment_id: string, pay_date: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // get all connections for this company
    const { data: connections, error: connErr } = await supabase.from("connections").select().eq('company_id', company_id)
    if (!connections || connErr) {
        console.log(connErr)
        return
    }

    // only get the newest connection (if there are multiple for this company)
    const connection: Connection = connections[connections.length - 1]

    const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', connection.customer_id).single()
    if (!customer || custErr) {
        console.log(custErr)
        return
    }

    console.log(`CUSTOMER: ${customer?.customer_name}`)
    console.log("CONNECTION")
    console.log(connection)

    const token = connection.finch_access_token

    // Init Finch SDK
    const finch = new Finch({
        accessToken: token
    })

    const payStatement = (await finch.hris.payStatements.retrieveMany({
        requests: [{ "payment_id": payment_id }]
    })).responses[0] as FinchPayStatementRes[]

    console.log(payStatement)

    // get the company directory from Finch
    const individuals = (await finch.hris.directory.list()).individuals as FinchEmployee[]

    const csv = convertPayStatementToFile()

    const status = await sendCSV(csv, customer.customer_name, connection.provider_id, customer.plan_id, pay_date)

}

async function handleNewDataSync(companyId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // get all connections for this company
    const { data: connection, error: connErr } = await supabase.from("connections").select().eq('company_id', companyId)
    if (!connection || connErr) {
        console.log(connErr)
        return
        //throw new Error(connErr?.message)
    }

    // only get the newest connection (if there are multiple for this company)
    const newestConnection: Connection = connection[connection.length - 1]

    const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', newestConnection.customer_id).single()
    if (!customer || custErr) {
        console.log(custErr)
        return
        //throw new Error(custErr?.message)
    }

    console.log(`CUSTOMER: ${customer?.customer_name}`)
    console.log("CONNECTION")
    console.log(newestConnection)

    const token = newestConnection.finch_access_token
    let lastProcessedPaymentId = newestConnection.last_processed_payment

    // Init Finch SDK
    const finch = new Finch({
        accessToken: token
    })

    const now = moment()
    const endDate = now.format("YYYY-MM-DD")
    const startDate = moment().subtract(3, 'months').format("YYYY-MM-DD")
    const startYear = moment().startOf("year").format("YYYY-MM-DD");

    if (!startDate.match(dateRegex) || !endDate.match(dateRegex) || !startYear.match(dateRegex)) {
        console.log("error: improper date format")
        return
    }

    // get year to date payments from Finch
    const initYtdPayments = (await finch.hris.payments.list({ start_date: startYear, end_date: endDate })).items as FinchPayment[]


    // if this is a new connection, lastProcessedPaymentId will be null
    if (lastProcessedPaymentId == null) {
        // set the lastProcessedPaymentId to 2 pay cycles ago in order to get some historical data
        lastProcessedPaymentId = initYtdPayments[initYtdPayments.length - 3].id as UUID
        console.log(lastProcessedPaymentId)
        // but write the newest (i.e. the last) paymentId to the database
        const { error } = await supabase.from("connections").update({ last_processed_payment: initYtdPayments[initYtdPayments.length - 1].id }).eq('id', newestConnection.id)

        if (error)
            console.log(error)
    }

    const newPayments = getAllNewPayments(initYtdPayments, lastProcessedPaymentId)

    // if no new pay statements (empty array), then don't create file
    if (!newPayments.length) {
        console.log(`No new pay statements for company ${customer.customer_name}`)
        return
    }

    // NEW: get the Finch pay statements for all new payments
    const newPayStatements = (await finch.hris.payStatements.retrieveMany({
        requests: newPayments.map(payment => {
            return { payment_id: payment.payment_id }
        })
    })).responses as FinchPayStatementRes[]

    // YTD: get the Finch pay statements for all year to date payments
    const ytdPayments: PayData[] = initYtdPayments.map(payment => {
        return {
            payment_id: payment.id,
            pay_date: payment.pay_date,
            pay_statements: []
        }
    })
    const ytdPayStatements = (await finch.hris.payStatements.retrieveMany({
        requests: ytdPayments.map(payment => {
            return { payment_id: payment.payment_id }
        })
    })).responses as FinchPayStatementRes[]

    // TODO: Validate that all payment ids in ytdPayments exist in ytdPayStatements. don't want that being wrong

    // For each pay-statement, match the individual pay-statements with the payment details
    newPayStatements.forEach(response => {
        var payment = newPayments.find(payment => payment.payment_id === response.payment_id)
        if (payment)
            payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
    })
    ytdPayStatements.forEach(response => {
        var payment = ytdPayments.find(payment => payment.payment_id === response.payment_id)
        if (payment)
            payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
    })

    // get the company directory from Finch
    const individuals = (await finch.hris.directory.list()).individuals as FinchEmployee[]

    const csv = convertPayrollToFile(individuals, newPayments, ytdPayments)

    try {
        const sftpClient = createSFTPClient()
        await sftpClient.putCSV(csv, `/${customer.customer_name}/finch-${companyId}-${newestConnection.provider_id}-payroll-${moment().format('YYYY-MM-DD')}.csv`); // could include payDate if broken out by each file
        console.log('File uploaded via SFTP successfully');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

export default { handleNewDataSync, handleNewPayment }

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
