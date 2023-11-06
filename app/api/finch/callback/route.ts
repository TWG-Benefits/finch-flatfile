import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type FinchTokenRes = {
    access_token: string
}

export async function GET(req: NextRequest) {
    console.log(req.method + " /api/finch/callback ");
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')?.replace('|', '&')
    const params = new URLSearchParams(state);
    const customerName = params.get('customerName');
    const customerId = params.get('customerId');
    console.log({
        code,
        state,
        customerId
    })

    const { data: customer, error: customerError } = await supabase.from("customers").select().eq('id', customerId)

    // only allow callback request if customerId matches a customerId stored in db
    if (!customer || customerError) {
        console.log(customerError)
        return NextResponse.redirect('/connection/failure')
    }

    console.log(JSON.stringify({
        client_id: process.env.FINCH_CLIENT_ID,
        client_secret: process.env.FINCH_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.BASE_URL + "/api/finch/callback"
    }))

    const authRes = await fetch(`${process.env.FINCH_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: process.env.FINCH_CLIENT_ID,
            client_secret: process.env.FINCH_CLIENT_SECRET,
            code: code,
            redirect_uri: process.env.BASE_URL + "/api/finch/callback"
        })
    })

    const response: FinchTokenRes = await authRes.json()
    const token = response.access_token

    // Create new Finch session
    const finch = new Finch({ accessToken: token })

    const introspect = await finch.account.introspect()

    const { error: connectionError } = await supabase.from("connections").insert({ customer_id: customerId, company_id: introspect.company_id, provider_id: introspect.payroll_provider_id, finch_access_token: token })

    if (connectionError) {
        return new NextResponse(
            redirect('/connection/failure')
        )
    } else {
        return new NextResponse(
            redirect('/connection/success')
        )
    }



}
