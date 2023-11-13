# Finch CSV

Description

## Demo

You can view a fully working demo at []().

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)]()

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

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

## Feedback and issues

Please file feedback and issues over on the ...

## create tables in supabase

```
-- Create the Customers table
 create table customers (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    name text null,
    plan_id 
    created_at timestamp with time zone not null default now(),
    CONSTRAINT Customers_pkey PRIMARY KEY (id)
  );
  alter table customers enable row level security;


 -- Insert some sample data
 insert into customers (name)
 values
   ('Walmart'),
   ('Chick-Fil-A'),
   ('Mattress Firm');

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

  CREATE policy "Authenticated users can read and write to customers"
  ON customers 
  FOR ALL
  TO authenticated
  USING ( true );

  CREATE policy "Authenticated users can read and write to connections"
  ON connections 
  FOR ALL
  TO authenticated
  USING ( true );
```
