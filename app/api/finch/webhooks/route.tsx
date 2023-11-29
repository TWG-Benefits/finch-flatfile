import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import wh from './handle-webhook';
import { finchWebhookSecret } from '@/utils/constants';

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
        await wh.handleNewDataSync(paymentEvent).then(() => {
            return new NextResponse(
                JSON.stringify({ ok: true })
            )
        })
    }

    return NextResponse.json(`Webhook not handled`, { status: 200 })
}
