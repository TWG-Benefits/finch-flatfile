"use client";

import { useEffect, useState } from 'react'
import { Switch } from '@headlessui/react'
import { CheckCircleIcon, ClipboardIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { classNames } from '@/utils/classnames';

export default function AuthorizeUrlForm() {
    const initialFormValues = {
        customerName: '',
        planId: '',
        //providerId: '', // not used yet
        confirm: false,
    }
    const [formValues, setFormValues] = useState(initialFormValues)
    const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(false)
    const [urlCopy, setUrlCopy] = useState(false)

    // used for getting ride of error state when all fields are finally filled out
    useEffect(() => {
        if (Object.values(formValues).every(field => field !== '' && field !== false)) {
            setError(false)
        }
    }, [formValues])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission

        if (Object.values(formValues).some(field => field === false || field === '')) {
            console.log(formValues)
            setError(true)
        } else {
            setError(false)
            setSuccess(false)
            const response = await fetch('/api/finch/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerName: formValues.customerName,
                    planId: formValues.planId
                })
            });


            const data = await response.json();

            setAuthorizeUrl(data)
            setFormValues(initialFormValues) // reset form
            setSuccess(true)

        }
    };

    const copyToClipboard = () => {
        if (authorizeUrl) {
            navigator.clipboard.writeText(authorizeUrl);
            setUrlCopy(true)
            setTimeout(() => setUrlCopy(false), 2 * 1000)
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="customer" className="block text-sm font-semibold leading-6 text-gray-900">
                            Customer Name
                        </label>
                        <div className="mt-2.5">
                            <input
                                value={formValues.customerName}
                                onChange={(e) => setFormValues({ ...formValues, customerName: e.target.value })}
                                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="plan_id" className="block text-sm font-semibold leading-6 text-gray-900">
                            Plan Id
                        </label>
                        <div className="mt-2.5">
                            <input
                                value={formValues.planId}
                                onChange={(e) => setFormValues({ ...formValues, planId: e.target.value })}
                                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <Switch.Group as="div" className="flex gap-x-4 sm:col-span-2">
                        <div className="flex h-6 items-center">
                            <Switch
                                checked={formValues.confirm}
                                onChange={(e) => setFormValues({ ...formValues, confirm: e.valueOf() })}
                                className={classNames(
                                    formValues.confirm ? 'bg-indigo-600' : 'bg-gray-200',
                                    'flex w-8 flex-none cursor-pointer rounded-full p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                )}
                            >
                                <span className="sr-only">Agree to policies</span>
                                <span
                                    aria-hidden="true"
                                    className={classNames(
                                        formValues.confirm ? 'translate-x-3.5' : 'translate-x-0',
                                        'h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out'
                                    )}
                                />
                            </Switch>
                        </div>
                        <Switch.Label className="text-sm leading-6 text-gray-600">
                            Confirm the 'Customer Name' matches the 'Plan ID'
                            {/* {' '}
                            <a href="#" className="font-semibold text-indigo-600">
                                privacy&nbsp;policy
                            </a> */}
                            .
                        </Switch.Label>
                    </Switch.Group>
                </div>
                <div className="mt-10">
                    <button
                        type="submit"
                        className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Create URL
                    </button>
                </div>
            </form>
            <div className="mx-auto max-w-xl">

                {success && (
                    <div className="rounded-md bg-green-50 p-4 mt-8">
                        <div className="flex">
                            <div className="flex-shrink-0 pt-1">
                                <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <div className='flex justify-between items-center'>
                                    <h3 className="text-sm font-bold text-green-800">Finch Connect URL</h3>
                                    <button onClick={copyToClipboard} className="flex space-x-2 flex-shrink-0 border border-green-300 rounded-md p-1 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50">
                                        <p className='text-sm text-green-800'>{!urlCopy ? "Copy to clipboard" : "Copied to clipboard"}</p>
                                        <ClipboardIcon className="h-5 w-5 text-green-800" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-6 text-sm text-green-700 break-all pr-8">
                                    <code className='break-words'>
                                        {authorizeUrl}
                                    </code>

                                </div>
                                <div className="mt-8 mb-4">
                                    <div className="-mx-2 -my-1.5 flex">
                                        <button
                                            type="button"
                                            className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800  border border-green-300 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                                            onClick={() => setSuccess(false)}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                )}
                {error && (

                    <div className="rounded-md bg-red-50 p-4 mt-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <ul role="list" className="list-disc space-y-1 pl-5">
                                        {!formValues.customerName && (<li>Customer name is required</li>)}
                                        {!formValues.planId && (<li>Plan Id is required</li>)}
                                        {!formValues.confirm && (<li>You must agree to the privacy policy</li>)}

                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
