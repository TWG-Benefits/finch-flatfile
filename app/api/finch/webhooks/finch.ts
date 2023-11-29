import { startDateForData } from "@/utils/constants"
import Finch from "@tryfinch/finch-api"
import moment from "moment"

async function getFinchData(token: string, paymentId: string | null = null): Promise<FinchResponseData> {
    // Init Finch SDK
    const finch = new Finch({
        accessToken: token
    })

    // FINCH: Get the full list of active employees at the company (/directory + /individual + /employment)
    const dataRefreshDate = (await finch.hris.company.retrieve().asResponse()).headers.get('finch-data-retrieved')
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


    let payments = null
    let payStatements = null

    if (paymentId) {
        // Get data for a single, new pay statement specified in the webhook
        const payment = ytdPayments.find(payment => payment.id == paymentId)
        payments = payment ? [payment] : null

        const payStatement = ytdPayStatements.find(payStatement => payStatement.payment_id == paymentId)
        payStatements = payStatement ? [payStatement] : null
    } else {
        // If a start data to get data is specified in environment variables use that date
        if (startDateForData) {
            const endDate = moment().format("YYYY-MM-DD")
            payments = (await finch.hris.payments.list({ start_date: startDateForData, end_date: endDate })).items as FinchPayment[]
            payStatements = (await finch.hris.payStatements.retrieveMany({
                requests: ytdPayments.map(payment => {
                    return { payment_id: payment.id }
                })
            })).responses as FinchPayStatement[]

        } else {
            // Otherwise, just return YTD historical data on the first pull
            payments = ytdPayments
            payStatements = ytdPayStatements
        }

    }

    return {
        individuals,
        employments,
        payments: payments,
        payStatements: payStatements,
        ytdPayStatements,
        dataRefreshDate
    }
}

function validateFinchData(finch: FinchResponseData): { success: boolean, data: FinchRequiredData | null } {
    if (!finch.individuals || !finch.employments) {
        console.error(`No employee data returned from Finch`)
        return { success: false, data: null }
    }

    if (!finch.payments || !finch.payStatements) {
        console.error(`No payments exists`)
        return { success: false, data: null }
    }

    if (!finch.ytdPayStatements) {
        console.error(`No year-to-date data was returned from Finch`)
        return { success: false, data: null }
    }

    // Validate that all pay statements have data
    // Trying to avoid 'data_sync_in_progress' 202 status codes (https://developer.tryfinch.com/docs/documentation/ns3poq7m3l2m0-data-syncs#pay-statements)
    const invalidYtdPayStatements = finch.ytdPayStatements.filter(obj => obj.code !== 200)
    if (invalidYtdPayStatements.length !== 0) {
        console.log(`Error in YTD pay statements`)
        console.log(invalidYtdPayStatements)
        return { success: false, data: null }
    }

    const invalidPayStatements = finch.payStatements.filter(obj => obj.code !== 200)
    if (invalidPayStatements.length !== 0) {
        console.log(`Error in current pay statements`)
        console.log(invalidYtdPayStatements)
        return { success: false, data: null }
    }

    return {
        success: true,
        data: {
            individuals: finch.individuals,
            employments: finch.employments,
            payments: finch.payments,
            payStatements: finch.payStatements,
            ytdPayStatements: finch.ytdPayStatements,
            dataRefreshDate: `This data was retrieved ${moment(finch.dataRefreshDate).fromNow()} on ${moment(finch.dataRefreshDate).format("dddd, MMMM Do YYYY, h:mm:ss a")}`
        }
    }
}

export { getFinchData, validateFinchData }
