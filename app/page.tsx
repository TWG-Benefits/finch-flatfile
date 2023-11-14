import Hero from '@/components/Hero'
import AuthorizeUrlForm from '@/components/AuthorizeUrlForm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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
          <div className="mx-auto max-w-2xl text-center">
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Please login first.
            </p>
          </div>
        }

      </div>
    </div>
  )
}
