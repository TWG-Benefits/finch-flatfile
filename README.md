# Finch Flatfile

Finch Flatfile is a deployable application provided by [Finch](https://tryfinch.com) which provides quick access to Finch’s modern, universal-API based platform. It unlocks the 200+ Payroll and HRIS providers without having to rebuild your existing file-based process.

## Demo

You can view a fully working demo at [https://finch-csv-demo.vercel.app](https://finch-csv-demo.vercel.app/).

## How Finch Flatfile Works

You host the Finch Flatfile application on your own infrastructure, allowing you to easily configure automatic flatfile generation of Organization, Pay, and Benefits data. This allows for a quick replacement of existing file-based workflows, and rapid deployment into existing integrations across record keeping systems, custom automations, and existing business processes.

Finch Flatfile is composed of a web frontend and a simple backend that can track customers and generate unique URLs for them to authenticate with Finch Connect. It then leverages Finch Webhooks to listen for new payroll updates across all connected customers and automatically generates a CSV with the data you want. This facilitates daily monitoring of new payroll data, organization data, and more.

Currently, file format setup and deployment is completed manually by Finch. Finch will help set the fields needed in consultation with you as part of the process in getting set up. As an added bonus, we’re working on a version update that will allow connections to be migrated to a more robust application by importing the Finch access_tokens for those connections. This future update will mitigate additional work from your customers, removing the requirement to re-authenticate.

## Deployment

### Supabase

### Finch

### Github

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftylernix%2Ffinch-file&env=APP_NAME,SUPPORT_EMAIL,NEXT_PUBLIC_FINCH_CLIENT_ID,FINCH_CLIENT_ID,FINCH_CLIENT_SECRET,FINCH_WEBHOOK_SECRET,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

The above will also clone the Finch Flatfile repo to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-develop-locally).

## Clone and develop locally

1. Clone the repo to your local machine

   ```bash
   git clone <your-github-organization>/finch-flatfile
   ```

1. Install [Vercel CLI](https://vercel.com/docs/cli)

   ```bash
   npm i -g vercel@latest
   ```
   OR
   ```
   yarn global add vercel
   ```
   THEN
   ```
   vercel --version
   ```

1. Link an [existing Vercel project](https://vercel.com/docs/cli/project-linking)

   ```bash
   $ vercel

   ? Set up and deploy "~/path/to/your/finch-flatfile-project"? [Y/n] y
   ? Which scope do you want to deploy to? "<Your Vercel Team Name>"
   ? Link to existing project? [y/N] y
   ? What’s the name of your existing project? <your-company-name>-finch-flatfile
   🔗 Linked to <Your Vercel Team Name>/<your-company-name>-finch-flatfile (created .vercel and added it to .gitignore)
   ```

1. [Pull environment variables](https://vercel.com/docs/cli/env) to a local file

   ```bash
   vercel env pull .env.local
   ```

1. [Optional] Rename `.env.local.example` to `.env.local` and update the environment variables yourself.

1. Install packages

   ```bash
   npm install
   ```
   OR
   ```bash
   yarn
   ```

2. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```
   OR
   ```bash
   yarn dev
   ```

   The app should now be running on [localhost:3000](http://localhost:3000/).

### Merge updates into forked application

This repo is forked and deployed individual for several customers. If any updates or changes are made to the upstream app, then you can sync these changes to your application.

```bash
$ git remote -v
$ git remote add upstream git@github.com:tylernix/finch-flatfile.git
$ git remote -v
$ git fetch upstream
$ git checkout main
$ git merge upstream/main
```

You can push the changes back to your deployed application in Vercel by running: `git push origin main`.

### Webhooks

To get finch webhooks to work locally, you need a service like [ngrok](https://ngrok.com/use-cases/ingress-for-dev-test-environments).

1. Install `ngrok`

   ```bash
   $ brew install ngrok/ngrok/ngrok
   ```

1. Update ngrok `authtoken`

   ```bash
   $ ngrok config add-authtoken <TOKEN>
   ```

1. Create [static ngrok domain](https://dashboard.ngrok.com/cloud-edge/domains)
1. Start ngrok on port 3000

   ```bash
   $ ngrok http --domain=<your-ngrok-domain> 3000
   ```

1. Create a new webhook in your [Finch Dashboard](https://dashboard.tryfinch.com/) using `https://<your-ngrok-domain>/api/finch/webhooks` (ex: https://dory-wired-mouse.ngrok-free.app/api/finch/webhooks)
   
1. Save `webhook_secret` in the .env.local variable


Update form fields can be found here
Update csv format can be found here
update output location can be found here

## Learn more, provide feedback, and raise issues

For more information, please contact your Developer Success Engineer or your Account Manager to learn about how Finch Flatfile can simplify your Finch deployment.

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
