import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { baseUrl } from '@/utils/constants';

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

    if (!customerId) {
        console.log("customerId required")
        return NextResponse.redirect(baseUrl + '/connection/failure')
    }

    const { data: customer, error: customerError } = await supabase.from("customers").select().eq('id', customerId)

    // for security reasons, only allow callback request if customerId matches a customerId stored in db
    if (!customer || customerError) {
        console.log("customerId does not match a customerId stored in database")
        console.log(customerError)
        return NextResponse.redirect(baseUrl + '/connection/failure')
    }

    // exchange the temporary authorization code for a permanent access token
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

    // Create a new connection in db associated with the right customer_id
    const { error: connectionError } = await supabase.from("connections").insert({ customer_id: customerId, company_id: introspect.company_id, provider_id: introspect.payroll_provider_id, finch_access_token: token })

    if (connectionError) {
        console.log(connectionError)
        return new NextResponse(
            redirect(baseUrl + '/connection/failure')
        )
    } else {
        return new NextResponse(
            redirect(baseUrl + '/connection/success')
        )
    }



}
