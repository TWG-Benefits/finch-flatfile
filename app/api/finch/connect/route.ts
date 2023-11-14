import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { supportEmail } from '@/utils/constants';

const FINCH_CLIENT_ID = process.env.FINCH_CLIENT_ID;
const FINCH_REDIRECT_URI = process.env.FINCH_REDIRECT_URI ?? 'http://localhost:3000/api/finch/callback';
const FINCH_PRODUCTS = process.env.FINCH_PRODUCTS ?? 'company directory individual employment payment pay_statement'
const FINCH_SANDBOX = process.env.FINCH_SANDBOX

export async function POST(req: Request) {
  console.log(req.method + " /api/finch/connect");
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  try {
    const { customerName, planId } = await req.json()

    const { data: customer, error } = await supabase.from("customers").insert({ customer_name: customerName, plan_id: planId }).select().single()

    if (error) {
      console.log(error)
      return NextResponse.json(`There was a problem creating the customer. Try signing out and signing back in. If the problem persists, contact ${supportEmail}.`, { status: 500 })
    }

    const authorizeUrl = (FINCH_SANDBOX === 'true')
      ? new URL(`https://connect.tryfinch.com/authorize?client_id=${FINCH_CLIENT_ID}&products=${FINCH_PRODUCTS}&redirect_uri=${FINCH_REDIRECT_URI}&state=customerName=${customerName}|customerId=${customer.id}&sandbox=${FINCH_SANDBOX}`).toString()
      : new URL(`https://connect.tryfinch.com/authorize?client_id=${FINCH_CLIENT_ID}&products=${FINCH_PRODUCTS}&redirect_uri=${FINCH_REDIRECT_URI}&state=customerName=${customerName}|customerId=${customer.id}`).toString()


    // save finch connect url for future reference (like reauthentication events)
    const { error: updateError } = await supabase.from("customers").update({ finch_connect_url: authorizeUrl }).eq('id', customer.id)

    if (updateError) {
      console.log(updateError)
      return NextResponse.json(`Error creating Finch Connect Url. If the problem persists, contact ${supportEmail}.`, { status: 500 })
    }

    return new NextResponse(
      JSON.stringify(authorizeUrl.toString())
    )
  } catch (error) {
    console.error(error);
    return NextResponse.json(`Error creating Finch Connect Url. If the problem persists, contact ${supportEmail}.`, { status: 500 })
  }

}
