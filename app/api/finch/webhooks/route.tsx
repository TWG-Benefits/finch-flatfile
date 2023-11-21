import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import wh from './handle-webhook';
import { finchWebhookSecret } from '@/utils/constants';
import { FinchWebhookEvent } from '@/types/finch';

const finch = new Finch() // no access token since not needed for webhook secret verification

export async function POST(req: Request) {
    console.log(req.method + " /api/finch/webhooks");

    const contentType = req.headers.get('Content-Type')
    const finchEventId = req.headers.get('Finch-Event-Id')
    const finchSignature = req.headers.get('Finch-Signature')
    const finchTimestamp = req.headers.get('Finch-Timestamp')

    console.log(`finch-event-id: ${finchEventId}`)

    const body = await req.text()
    const payload: FinchWebhookEvent = finch.webhooks.unwrap(body, req.headers, finchWebhookSecret)
    console.log(payload)

    if (payload.event_type == 'test') {
        // await ds.handleTestDataSync().then(() => {
        //     return new NextResponse(
        //         JSON.stringify({ ok: true })
        //     )
        // })

        console.log(payload)

        return new NextResponse(
            JSON.stringify({ ok: true })
        )
    }

    if (payload.event_type == 'payment.created') {
        const paymentEvent: PaymentWebhook = payload
        await wh.handleNewPayment(paymentEvent.company_id, paymentEvent.data.payment_id, paymentEvent.data.pay_date).then(() => {
            return new NextResponse(
                JSON.stringify({ ok: true })
            )
        })
    }

    if (payload.event_type == 'job.data_sync_all.completed') {
        const paymentEvent: PaymentWebhook = payload
        await wh.handleNewDataSync(paymentEvent.company_id).then(() => {
            return new NextResponse(
                JSON.stringify({ ok: true })
            )
        })
    }

    // TODO: filter on finchEventType = new payroll

    return new NextResponse(
        JSON.stringify({ ok: true })
    )
}
