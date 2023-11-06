"use client";

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Failure() {
    return (
        <div className="flex-1 w-full flex flex-col justify-center content-center">
            <div className="flex items-end justify-center text-center sm:items-center sm:p-0">

                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">
                                Connection failed
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Email Support
                        </button>
                    </div>
                </div>
            </div>
        </div>


    )
}
