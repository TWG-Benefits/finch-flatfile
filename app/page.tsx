import Hero from '@/components/Hero'
import AuthorizeUrlForm from '@/components/AuthorizeUrlForm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Index() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user }, } = await supabase.auth.getUser()

  return (
    <div className="flex-1 w-full flex flex-col pt-20 items-center">
      <div className="animate-in flex-1 flex flex-col opacity-0 w-full max-w-2xl px-3">
        {user ?
          <div>
            <Hero />
            <main>
              <AuthorizeUrlForm />
            </main>
          </div>
          :
          <div className="mx-auto max-w-2xl text-center flex flex-col space-y-4">
            <p className="mt-2 text-lg leading-8 text-gray-600">
              You must be logged in to use this application.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Login
            </Link>
          </div>
        }

      </div>
    </div>
  )
}
