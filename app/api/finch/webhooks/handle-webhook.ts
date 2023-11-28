import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment, { Moment } from 'moment'
import { createSFTPClient } from '@/utils/sftp';
import { Connection, Customer } from '@/types/database';
import { UUID } from 'crypto';
import convertPayrollToFile from './convert-payroll-to-file';
import { NextResponse } from 'next/server';
import convertFileToCSV from './convert-file-to-CSV';

const sftpPath = process.env.SFTP_PATH

// yyyy-mm-dd, including leap years
const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/



type PayData = {
    payment_id: string,
    pay_date: string | null,
    pay_statements: FinchIndividualPayStatement[]
}

async function handleNewPayment(company_id: string, payment_id: string, pay_date: string): Promise<boolean> {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // get all connections for this company
    const { data: connections, error: connErr } = await supabase.from("connections").select().eq('company_id', company_id)
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

    // Init Finch SDK
    const finch = new Finch({
        accessToken: token
    })

    // FINCH: Get the full list of active employees at the company (/directory + /individual + /employment)
    const directory = (await finch.hris.directory.list()).individuals.filter(ind => ind.is_active == true) as FinchEmployee[]
    const individuals = (await finch.hris.individuals.retrieveMany({
        options: {
            include: ["ssn"] // must include SSN, the app should already be authorized using the 'ssn' product scope in Finch Connect
        },
        requests: directory.map(ind => {
            return { individual_id: ind.id }
        })
    })).responses as FinchIndividualRes
    const employments = (await finch.hris.employments.retrieveMany({
        requests: directory.map(ind => {
            return { individual_id: ind.id }
        })
    })).responses as FinchEmploymentRes

    // FINCH: Get year-to-date payments (to calculate individual YTD field attainment)
    const endDate = moment().format("YYYY-MM-DD")
    const startDate = moment().startOf("year").format("YYYY-MM-DD");
    const ytdPayments = (await finch.hris.payments.list({ start_date: startDate, end_date: endDate })).items as FinchPayment[]
    const ytdPayStatements = (await finch.hris.payStatements.retrieveMany({
        requests: ytdPayments.map(payment => {
            return { payment_id: payment.id }
        })
    })).responses as FinchPayStatement[]

    // Validate that all pay statements have data
    // Trying to avoid 'data_sync_in_progress' 202 status codes (https://developer.tryfinch.com/docs/documentation/ns3poq7m3l2m0-data-syncs#pay-statements)
    const invalidPayStatements = ytdPayStatements.filter(obj => obj.code !== 200)
    if (invalidPayStatements.length !== 0) {
        console.log(`Error in YTD Pay Statements`)
        console.log(invalidPayStatements)
        return false
    }

    // FINCH: Get the new pay statement specified in the webhook
    const payment = ytdPayments.find(payment => payment.id == payment_id)
    const payStatement = ytdPayStatements.find(payStatement => payStatement.payment_id == payment_id)
    if (!payment || !payStatement) {
        console.error(`No payment ${payment_id} found`)
        return false
    }

    //console.log(payStatement)

    if (payStatement.code !== 200) {
        console.log(`Error for pay statement ${payStatement.payment_id}.`)
        return false
    }

    // Process the Finch data and map them into the fields the customer requires
    const file = processPayment(customer.plan_id, individuals, employments, payment, payStatement, ytdPayStatements)
    const csv = convertFileToCSV(file)

    const status = await sendCSV(csv, customer.customer_name, connection.provider_id, customer.plan_id, pay_date)

    return status
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

function processPayment(plan_id: number, individuals: FinchIndividualRes, employments: FinchEmploymentRes, payment: FinchPayment, payStatement: FinchPayStatement, ytdPayStatements: FinchPayStatement[]): CSVRow[] {
    const payDate = payment?.pay_date
    const payPeriodStartDate = payment.pay_period?.start_date
    const payPeriodEndDate = payment.pay_period?.end_date
    const payFrequencyCode = "semi_monthly" // ???

    var test: CSVRow[] = []
    payStatement.body.pay_statements.forEach(paycheck => {
        const individual = individuals.find(ind => ind.individual_id == paycheck.individual_id)
        const employment = employments.find(emp => emp.individual_id == paycheck.individual_id)

        test.push({
            plan_id: plan_id,
            finch_individual_id: paycheck.individual_id,
            social_security_number: individual?.body?.ssn,
            first_name: individual?.body?.first_name,
            middle_name: individual?.body?.middle_name,
            last_name: individual?.body?.last_name,
            birth_date: individual?.body?.dob,
            hire_date: employment?.body?.start_date,
            termination_date: employment?.body?.end_date,
            rehire_date: null,
            department_name: employment?.body?.department?.name,
            address_line1: individual?.body.residence?.line1,
            address_line2: individual?.body.residence?.line2,
            address_city: individual?.body.residence?.city,
            address_state: individual?.body.residence?.state,
            address_zip_code: individual?.body.residence?.postal_code,
            email_address_personal: individual?.body?.emails.filter(email => email.type === 'personal').map(email => email.data).join('; '),
            email_address_work: individual?.body?.emails.filter(email => email.type === 'work').map(email => email.data).join('; '),
            phone_number_personal: individual?.body?.phone_numbers.filter(phone => phone.type === 'personal').map(phone => phone.data).join('; '),

            gross_wages_amount: paycheck.gross_pay.amount,
            total_hours: paycheck?.total_hours,
            debit_date: payDate,
            pay_period_start_date: payPeriodStartDate,
            pay_period_end_date: payPeriodEndDate,
            pay_frequency_code: payFrequencyCode,
            deduction_401k_amount: sumAmountsForType(paycheck.employee_deductions, '401k'),
            contribution_401k_match_amount: sumAmountsForType(paycheck.employer_contributions, '401k'),
            deduction_roth_401k_amount: sumAmountsForType(paycheck.employee_deductions, '401k_roth'),
            contribution_safe_harbor_match_amount: sumAmountsForType(paycheck.employer_contributions, '401k_roth'),
            profit_sharing_amount: null,
            deduction_safe_harbor_non_elective_amount: null,
            deduction_401k_loan_amount: sumAmountsForType(paycheck.employee_deductions, '401k_loan'),

            YTD_compensation_amount: calcIndividualYtdByField(paycheck.individual_id, 'gross_pay', ytdPayStatements),
            YTD_total_hours: calcIndividualYtdByField(paycheck.individual_id, 'total_hours', ytdPayStatements),
            YTD_deduction_401k_amount: calcIndividualYtdByField(paycheck.individual_id, '401k', ytdPayStatements, 'deductions'),
            YTD_contribution_401k_match_amount: calcIndividualYtdByField(paycheck.individual_id, '401k', ytdPayStatements, 'contributions'),
            YTD_deduction_roth_401k_amount: calcIndividualYtdByField(paycheck.individual_id, '401k_roth', ytdPayStatements, 'deductions'),
            YTD_contribution_safe_harbor_match_amount: null,
            YTD_profit_sharing_amount: null,
            YTD_deduction_safe_harbor_non_elective_amount: null,
        })
    })
    return test

}

function calcIndividualYtdByField(individualId: string, field: string, ytdPayStatements: FinchPayStatement[], category: 'deductions' | 'contributions' | null = null): number {
    let init = 0
    ytdPayStatements.forEach(payment => {
        const indPaycheck = payment.body.pay_statements.find(paycheck => paycheck.individual_id == individualId)
        if (indPaycheck !== null || indPaycheck !== undefined) {
            init += findFieldAmount(indPaycheck, field, category) ?? 0
        }
    })
    return init
}

function findFieldAmount(obj: any, fieldToFind: string, category: 'deductions' | 'contributions' | null = null): number | undefined {
    // Base case: If obj is not an object or is null, return undefined
    if (obj === null || obj === undefined) {
        return undefined;
    }

    if (category === 'deductions' && obj.hasOwnProperty('employee_deductions')) {
        return sumFieldInDeductions(obj, fieldToFind);
    }

    if (category === 'contributions' && obj.hasOwnProperty('employer_contributions')) {
        return sumFieldInContributions(obj, fieldToFind);
    }

    // If the current level is an object, iterate through its fields
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const item = obj[key];
            if (item && typeof item === 'object') {
                const result = findFieldAmount(item, fieldToFind, category);
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }

    // If the field is not found, return undefined
    return undefined;
}

function sumFieldInDeductions(obj: any, fieldType: string): number {
    const category = 'employee_deductions'
    if (!obj || !obj[category] || !Array.isArray(obj[category])) {
        return 0;
    }

    return sumAmountsForType(obj[category], fieldType);
}

function sumFieldInContributions(obj: any, fieldType: string): number {
    const category = 'employer_contributions'
    if (!obj || !obj[category] || !Array.isArray(obj[category])) {
        return 0;
    }

    return sumAmountsForType(obj[category], fieldType);
}

function sumAmountsForType(array: any[] | null, type: string | null): number {
    if (!array) return 0;

    return array.reduce((total, element) => {
        if (element?.type === type) {
            return total + (element?.amount || 0);
        }
        return total;
    }, 0);
}
