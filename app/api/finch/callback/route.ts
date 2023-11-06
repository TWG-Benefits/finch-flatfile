import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
// import database from '../../../util/database'

type FinchTokenRes = {
    access_token: string
}

export async function GET(req: NextRequest) {
    console.log(req.method + " /api/finch/callback ");

    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')?.replace('|', '&')
    const params = new URLSearchParams(state);
    const customerName = params.get('customerName');
    const customerId = params.get('customerId');

    // TODO: only allow request if customerId matches a customerId stored in db

    const authRes = await fetch(`${process.env.FINCH_API_URL}/auth/token`, {
        method: 'post',
        body: JSON.stringify({
            client_id: process.env.FINCH_CLIENT_ID,
            client_secret: process.env.FINCH_CLIENT_SECRET,
            code: code,
            redirect_uri: process.env.BASE_URL + "/api/finch/callback"
        })
    })

    const response: FinchTokenRes = await authRes.json()

    const finch = new Finch({ accessToken: response.access_token })

    const introspect = await finch.account.introspect()
    console.log(introspect)

    // TODO: save access_token in db

    if (authRes.status != 200) {

        return new NextResponse(
            redirect('/connection/failure')
        )
    } else {
        return new NextResponse(
            redirect('/connection/success')
        )
    }



}
