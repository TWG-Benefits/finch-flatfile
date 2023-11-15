import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { finchClientId, finchProducts, finchRedirectUri, isFinchSandbox, supportEmail } from '@/utils/constants';

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

    const authorizeUrl = (isFinchSandbox === 'true')
      ? new URL(`https://connect.tryfinch.com/authorize?client_id=${finchClientId}&products=${finchProducts}&redirect_uri=${finchRedirectUri}&state=customerName=${customerName}|customerId=${customer.id}&sandbox=${isFinchSandbox}`).toString()
      : new URL(`https://connect.tryfinch.com/authorize?client_id=${finchClientId}&products=${finchProducts}&redirect_uri=${finchRedirectUri}&state=customerName=${customerName}|customerId=${customer.id}`).toString()


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
