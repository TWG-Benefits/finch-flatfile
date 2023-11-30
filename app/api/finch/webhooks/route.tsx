import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import wh from './handle-webhook';
import { finchWebhookSecret } from '@/utils/constants';

export const runtime = 'edge'; // 'nodejs' is the default

const finch = new Finch() // no access token since not needed for webhook secret verification

export async function POST(req: Request) {
    console.log(req.method + " /api/finch/webhooks");

    const contentType = req.headers.get('Content-Type')
    const finchEventId = req.headers.get('Finch-Event-Id')
    const finchSignature = req.headers.get('Finch-Signature')
    const finchTimestamp = req.headers.get('Finch-Timestamp')

    console.log(`finch-event-id: ${finchEventId}`)

    const body = await req.text()
    const payload = finch.webhooks.unwrap(body, req.headers, finchWebhookSecret) as FinchWebhookEvent
    console.log(payload)

    if (payload.event_type == 'test') {
        console.log(payload)

        // const testWebhook: DataSyncAllWebhook = {
        //     account_id: 'e086af4d-ac92-4886-8c46-8b7007c2138e',
        //     company_id: '27bb0853-ce43-4907-9058-e0a26cd00d07',
        //     data: {
        //         job_id: 'bc2265a8-fdce-463a-8631-bf5097ce39e1',
        //         job_url: 'https://api.tryfinch.com/jobs/automated/bc2265a8-fdce-463a-8631-bf5097ce39e1'
        //     },
        //     event_type: 'job.data_sync_all.completed'
        // }
        // await wh.handleNewDataSync(testWebhook).then(success => {
        //     if (success)
        //         return NextResponse.json(`Success`, { status: 200 })
        //     else
        //         return NextResponse.json(`Error`, { status: 500 })
        // })

        // const testWebhook: PaymentWebhook = {
        //     account_id: 'e086af4d-ac92-4886-8c46-8b7007c2138e',
        //     company_id: '27bb0853-ce43-4907-9058-e0a26cd00d07',
        //     event_type: "payment.created",
        //     data: {
        //         payment_id: "3368f55c-511c-47c9-96e4-acd7037e16ea",
        //         pay_date: "2023-11-17"
        //     }
        // }
        // await wh.handleNewPayment(testWebhook).then(success => {
        //     if (success)
        //         return NextResponse.json(`Success`, { status: 200 })
        //     else
        //         return NextResponse.json(`Error`, { status: 500 })

        // })


        await wh.handleTestWebhook().then(success => {
            if (success == true)
                return NextResponse.json(`Success`, { status: 200 })

            return NextResponse.json(`Error`, { status: 500 })

        })
    }

    if (payload.event_type == 'payment.created') {
        const paymentEvent = payload as PaymentWebhook
        await wh.handleNewPayment(paymentEvent).then(success => {
            if (success)
                return NextResponse.json(`Success`, { status: 200 })
            else
                return NextResponse.json(`Error`, { status: 500 })

        })
    }

    if (payload.event_type == 'account.updated') {
        const accountUpdatedEvent = payload as AccountUpdateWebhook
        await wh.handleAccountUpdated(accountUpdatedEvent).then(success => {
            if (success)
                return NextResponse.json(`Success`, { status: 200 })
            else
                return NextResponse.json(`Error`, { status: 500 })
        })
    }

    if (payload.event_type == 'job.data_sync_all.completed') {
        const paymentEvent = payload as DataSyncAllWebhook
        await wh.handleNewDataSync(paymentEvent).then(success => {
            if (success)
                return NextResponse.json(`Success`, { status: 200 })
            else
                return NextResponse.json(`Error`, { status: 500 })
        })
    }

    return NextResponse.json(`Webhook not handled`, { status: 200 })
}
