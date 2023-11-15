# Finch File

Finch File is a low-lift tool provided by [Finch](https://tryfinch.com), which simplifies quick access to Finch’s modern, universal-API based platform. It unlocks the 200+ Payroll and HRIS providers without having to rebuild existing file-based tooling from scratch.

## Demo

You can view a fully working demo at [https://finch-csv-demo.vercel.app](https://finch-csv-demo.vercel.app/).

## How Finch File Works

You host Finch File on your own infrastructure, allowing you to easily configure automatic File generation of Organization, Pay, and Benefits data. This allows for a quick replacement of existing file-based workflows, and rapid deployment into existing integrations across record keeping systems, custom automations, and existing business processes.

Finch File is composed of a web frontend and a simple backend that can track customers and generate unique URLs for them to authenticate with Finch Connect. It then leverages Finch Webhooks to listen for new payroll updates across all connected customers and automatically generates a CSV with the data you want. This facilitates daily monitoring of new payroll data, organization data, and more.

Currently, file format setup and deployment is completed manually by Finch. Finch will help set the fields needed in consultation with you as part of the process in getting set up. As an added bonus, we’re working on a version update that will allow connections to be migrated to a more robust application by importing the Finch access_tokens for those connections. This future update will mitigate additional work from your customers, removing the requirement to re-authenticate.

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftylernix%2Ffinch-file&env=APP_NAME,SUPPORT_EMAIL,NEXT_PUBLIC_FINCH_CLIENT_ID,FINCH_CLIENT_ID,FINCH_CLIENT_SECRET,FINCH_WEBHOOK_SECRET)

[![Deploy with Vercel + Supabase](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftylernix%2Ffinch-file&env=APP_NAME,SUPPORT_EMAIL,NEXT_PUBLIC_FINCH_CLIENT_ID,FINCH_CLIENT_ID,FINCH_CLIENT_SECRET,FINCH_WEBHOOK_SECRET&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6)

The above will also clone the Finch File repo to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app -e with-supabase
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd name-of-new-app
   ```

4. Rename `.env.local.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://app.supabase.com/project/_/settings/api)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

6. Get webhooks to work locally, you need a service like Ngrok.
   
    1. install ngrok (brew install ngrok/ngrok/ngrok)
    2. update ngrok authtoken (ngrok config add-authtoken <TOKEN>)
    3. create static ngrok domain (https://dashboard.ngrok.com/cloud-edge/domains)
    4. start ngrok on port 3000
    5. create webhook in finch using ngrok static domain + /api/finch/webhooks (ex: https://dory-wired-mouse.ngrok-free.app/api/finch/webhooks)
    6. save webhook secret in app .env variable
    */

## Learn more, provide feedback, and raise issues

For more information, please contact your Developer Success Engineer or your Account Executive to learn about how Finch File can simplify your Finch deployment.

---

## create tables in supabase

```
-- Create the Customers table
 create table customers (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    customer_name text null,
    plan_id bigint null,
    finch_connect_url text null,
    created_at timestamp with time zone not null default now(),
    CONSTRAINT Customers_pkey PRIMARY KEY (id)
  );
  alter table customers enable row level security;

-- Create the Connections table
 create table connections (
    id uuid not null default gen_random_uuid (),
    customer_id uuid not null references customers,
    company_id uuid not null,
    provider_id text not null,
    account_id uuid null,
    finch_access_token uuid not null,
    created_at timestamp with time zone not null default now(),
    CONSTRAINT connections_company_id_key unique (finch_access_token),
    CONSTRAINT Connections_pkey PRIMARY KEY (id),
    CONSTRAINT "customerId_fkey" FOREIGN KEY ("customer_id")
        REFERENCES  customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
  );
  alter table connections enable row level security;

  CREATE policy "Authenticated users and anon key can read and write to customers"
  ON customers 
  FOR ALL
  TO anon, authenticated
  USING ( true );

  CREATE policy "Authenticated users and anon key can read and write to connections"
  ON connections 
  FOR ALL
  TO anon, authenticated
  USING ( true );
```
