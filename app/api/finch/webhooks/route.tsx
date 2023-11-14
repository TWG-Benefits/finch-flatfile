import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import ds from './handle-data-sync';

const finch = new Finch() // no access token since not needed for webhook secret verification

export async function POST(req: Request) {
    console.log(req.method + " /api/finch/webhooks");

    // const contentType = req.headers.get('Content-Type')
    // const finchEventId = req.headers.get('Finch-Event-Id')
    // const finchSignature = req.headers.get('Finch-Signature')
    // const finchTimestamp = req.headers.get('Finch-Timestamp')

    // console.log(`finch-event-id: ${finchEventId}`)

    // const body = await req.text()
    // const payload = finch.webhooks.unwrap(body, req.headers, process.env.FINCH_WEBHOOK_SECRET) as FinchWebhookPayload
    // console.log(payload)

    const payload = {
        account_id: '57abf68d-ade1-4d4e-8e80-c169e6a51a63',
        company_id: 'b2dc9f68-bd26-404a-8ca7-4da59d8a7eb7',
        data: {
            job_id: 'c3233d2e-77a0-45fc-8804-a095dd17bba8',
            job_url: 'https://api.tryfinch.com/jobs/automated/c3233d2e-77a0-45fc-8804-a095dd17bba8'
        },
        event_type: 'job.data_sync_all.completed'
    }

    if (payload.event_type == 'test') {
        await ds.handleTestDataSync().then(() => {
            return new NextResponse(
                JSON.stringify({ ok: true })
            )
        })
    }

    if (payload.event_type == 'job.data_sync_all.completed') {
        await ds.handleNewDataSync(payload.company_id).then(() => {
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
