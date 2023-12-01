import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment, { Moment } from 'moment'
import { Connection, Customer } from '@/types/database';
import convertFileToCSV from './convert-file-to-CSV';
import processPayments from './process-payments';
import { getFinchData, validateFinchData } from './finch';
import { finchApiUrl } from '@/utils/constants';
import send from './send-file'

async function handleNewPayment(webhook: PaymentWebhook): Promise<boolean> {
    console.log(`Handle new payment webhook`)

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

    const result = await send.sendFileViaSFTP(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, webhook.data.pay_date)

    return result
}

async function handleNewDataSync(webhook: DataSyncAllWebhook) {
    console.log(`Handle new data sync webhook`)

    const { status, data } = await getCustomerAndConnectionFromDB(webhook.company_id)

    if (!status || !data)
        return false

    const token = data.connection.finch_access_token

    if (!data.connection.data_sync_complete) {
        const finchData = await getFinchData(token)
        const finch = validateFinchData(finchData)

        if (!finch.success || !finch.data)
            return false

        // Process the Finch data and map them into the fields the customer requires
        const file = processPayments(data.customer.plan_id, finch.data)
        const csv = convertFileToCSV(file, finch.data.dataRefreshDate)

        const result = await send.sendFileViaSFTP(csv, data.customer.customer_name, data.connection.provider_id, data.customer.plan_id, moment().format("YYYY-MM-DD"))

        if (result)
            await setDataSyncCompleteInDB(data.connection.id)

        return result

    }

    console.log(`Historical data already processed for ${data.customer.customer_name}`)
    return false

}

async function handleAccountUpdated(webhook: AccountUpdateWebhook): Promise<boolean> {
    console.log(`Handle account updated Webhook`)
    const { status, data } = await getCustomerAndConnectionFromDB(webhook.company_id)

    if (!status || !data)
        return false

    switch (webhook.data.status) {
        case 'CONNECTED':
            console.log(`${data.customer.customer_name} successfully connected`)
            break;
        case 'ERROR_REAUTH':
            console.error(`Need to reauthenticate ${data.customer.customer_name}. Send Finch Connect Url again. ${data.customer.finch_connect_url}`)
            break;
        default:
            console.log(`${webhook.data.status} status event not handled`)
    }
    return true
}

async function handleTestWebhook(): Promise<boolean> {
    console.log(`Handle test webhook`)

    const csv = `
    ID,Name,Department
    1,John Doe,Finance
    2,Jane Smith,Marketing
    3,Emily Johnson,Human Resources
    4,Michael Brown,IT
    `

    try {
        const status = await send.sendFileViaSFTP(csv, "TESTING", "test", 123, moment().format("YYYY-MM-DD"))
        console.log('File uploaded via SFTP successfully');
        return status
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

export default { handleNewPayment, handleNewDataSync, handleAccountUpdated, handleTestWebhook }



type CustomerConnection = {
    status: boolean,
    data: {
        customer: Customer;
        connection: Connection
    } | null
}
async function setDataSyncCompleteInDB(connectionId: string): Promise<boolean> {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Set data_sync_complete to true for connection
    const { error } = await supabase.from("connections").update({ data_sync_complete: true }).eq('id', connectionId)

    if (!error) {
        console.log(`Set data sync complete for connection_id ${connectionId}`)
        return true
    }

    return false
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
    console.log(`CONNECTION: ${connection.id}`)
    console.log(`PROVIDER: ${connection.provider_id}`)

    return { status: true, data: { customer, connection } }
}

