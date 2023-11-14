// pages/api/generate-url.ts
import { NextResponse } from 'next/server';
import Finch from '@tryfinch/finch-api';
//import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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

    const { data, error } = await supabase.from("customers").insert({ customer_name: customerName, plan_id: planId }).select()
    // possibly store sponsor's plan id if desired

    if (error) {
      console.log(error)
      return NextResponse.json("error")
    }

    const customerId = data[0].id

    const authorizeUrl = (FINCH_SANDBOX === 'true')
      ? new URL(`https://connect.tryfinch.com/authorize?client_id=${FINCH_CLIENT_ID}&products=${FINCH_PRODUCTS}&redirect_uri=${FINCH_REDIRECT_URI}&state=customerName=${customerName}|customerId=${customerId}&sandbox=${FINCH_SANDBOX}`).toString()
      : new URL(`https://connect.tryfinch.com/authorize?client_id=${FINCH_CLIENT_ID}&products=${FINCH_PRODUCTS}&redirect_uri=${FINCH_REDIRECT_URI}&state=customerName=${customerName}|customerId=${customerId}`).toString()


    // save finch connect url for future reference (like reauthentication events)
    const { error: updateError } = await supabase.from("customers").update({ finch_connect_url: authorizeUrl }).eq('id', customerId)

    if (updateError) {
      console.log(updateError)
      return NextResponse.json("error")
    }

    return new NextResponse(
      JSON.stringify(authorizeUrl.toString())
    )
  } catch (error) {
    console.error(error);
  }

}
