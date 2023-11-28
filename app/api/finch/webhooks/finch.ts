import Finch from "@tryfinch/finch-api"
import moment from "moment"

async function getFinchData(token: string, paymentId: string): Promise<FinchResponseData> {
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
    // const invalidPayStatements = ytdPayStatements.filter(obj => obj.code !== 200)
    // if (invalidPayStatements.length !== 0) {
    //     console.log(`Error in YTD Pay Statements`)
    //     console.log(invalidPayStatements)
    //     return false
    // }

    // FINCH: Get the new pay statement specified in the webhook
    const payment = ytdPayments.find(payment => payment.id == paymentId)
    const payStatement = ytdPayStatements.find(payStatement => payStatement.payment_id == paymentId)

    //console.log(payStatement)

    // if (payStatement.code !== 200) {
    //     console.log(`Error for pay statement ${payStatement.payment_id}.`)
    //     return false
    // }

    return {
        individuals,
        employments,
        payment,
        payStatement,
        ytdPayStatements
    }
}

function validateFinchData(finch: FinchResponseData): { success: boolean, data: FinchRequiredData | null } {
    if (!finch.individuals || !finch.employments) {
        console.error(`No employee data returned from Finch`)
        return { success: false, data: null }
    }

    if (!finch.payment || !finch.payStatement) {
        console.error(`No payment ${finch.payment?.id} exists`)
        return { success: false, data: null }
    }

    if (!finch.ytdPayStatements) {
        console.error(`No year-to-date data was returned from Finch`)
        return { success: false, data: null }
    }

    // Validate that all pay statements have data
    // Trying to avoid 'data_sync_in_progress' 202 status codes (https://developer.tryfinch.com/docs/documentation/ns3poq7m3l2m0-data-syncs#pay-statements)
    const invalidPayStatements = finch.ytdPayStatements.filter(obj => obj.code !== 200)
    if (invalidPayStatements.length !== 0) {
        console.log(`Error in YTD Pay Statements`)
        console.log(invalidPayStatements)
        return { success: false, data: null }
    }

    if (finch.payStatement.code !== 200) {
        console.log(`Error for pay statement ${finch.payStatement.payment_id}.`)
        return { success: false, data: null }
    }

    return {
        success: true,
        data: {
            individuals: finch.individuals,
            employments: finch.employments,
            payment: finch.payment,
            payStatement: finch.payStatement,
            ytdPayStatements: finch.ytdPayStatements
        }
    }
}

export { getFinchData, validateFinchData }
