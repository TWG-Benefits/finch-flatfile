import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import ds from './handle-data-sync';

const finch = new Finch() // no access token since not needed for webhook secret verification

export async function POST(req: Request) {
    console.log(req.method + " /api/finch/webhooks");

    const contentType = req.headers.get('Content-Type')
    const finchEventId = req.headers.get('Finch-Event-Id')
    const finchSignature = req.headers.get('Finch-Signature')
    const finchTimestamp = req.headers.get('Finch-Timestamp')

    console.log(`finch-event-id: ${finchEventId}`)

    const body = await req.text()
    const payload = finch.webhooks.unwrap(body, req.headers, process.env.FINCH_WEBHOOK_SECRET) as FinchWebhookPayload
    console.log(payload)

    /*
    1. install ngrok (brew install ngrok/ngrok/ngrok)
    2. update ngrok authtoken (ngrok config add-authtoken <TOKEN>)
    3. create static ngrok domain (https://dashboard.ngrok.com/cloud-edge/domains) 
    4. start ngrok on port 3000
    5. create webhook in finch using ngrok static domain + /api/finch/webhooks (ex: https://dory-wired-mouse.ngrok-free.app/api/finch/webhooks)
    6. save webhook secret in app .env variable
    */

    if (payload.event_type == 'test') {
        console.log("handle test data sync")
        await ds.handleTestDataSync().then(() => {
            return new NextResponse(
                JSON.stringify({ ok: true })
            )
        })
    }

    if (payload.event_type == 'job.data_sync_all.complete') {
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
