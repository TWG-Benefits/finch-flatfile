import Finch from '@tryfinch/finch-api';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import moment from 'moment'
import { createSFTPClient } from '@/utils/sftp';
import { Connection, Customer } from '@/types/database';
import { UUID } from 'crypto';


const sftpClient = createSFTPClient()

// yyyy-mm-dd, including leap years
const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/

type FinchDirectoryRes = {
    paging: {
        count: number
        offset: number
    },
    individuals: FinchEmployee[]
}
type FinchPayStatementsRes = {
    responses: FinchPayStatementRes
}
type FinchPayStatementRes = {
    payment_id: string,
    code: number,
    body: {
        paging: {
            count: number,
            offset: number
        },
        pay_statements: FinchPayStatement[]
    }
}
type PayData = {
    payment_id: string,
    pay_date: string | null,
    pay_statements: FinchPayStatement[]
}

async function handleNewDataSync(companyId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const { data: connection, error: connErr } = await supabase.from("connections").select().eq('company_id', companyId)
    if (!connection || connErr) {
        console.log(connErr)
        return
        //throw new Error(connErr?.message)
    }

    const newestConnection: Connection = connection[connection.length - 1]

    const { data: customer, error: custErr } = await supabase.from("customers").select().eq('id', newestConnection.customer_id).single()
    if (!customer || custErr) {
        console.log(custErr)
        return
        //throw new Error(custErr?.message)
    }

    console.log(`CUSTOMER: ${customer?.customer_name}`)
    console.log("CONNECTION")
    console.log(newestConnection)

    const token = newestConnection.finch_access_token
    let lastProcessedPaymentId = newestConnection.last_processed_payment

    // Init Finch SDK
    const finch = new Finch({
        accessToken: token
    })

    const now = moment()
    const endDate = now.format("YYYY-MM-DD")
    const startDate = moment().subtract(3, 'months').format("YYYY-MM-DD")

    if (!startDate.match(dateRegex) || !endDate.match(dateRegex)) {
        console.log("error: improper start_date or end_date format")
        return
    }

    // get all the payments in the last 3 months from Finch
    const recentPayments = (await finch.hris.payments.list({ start_date: startDate, end_date: endDate })).items as FinchPayment[]

    // if this is a new connection, lastProcessedPaymentId will be null
    if (lastProcessedPaymentId == null) {
        // set the lastProcessedPaymentId to 2 pay cycles ago in order to get some historical data
        lastProcessedPaymentId = recentPayments[recentPayments.length - 3].id as UUID
        console.log(lastProcessedPaymentId)
        // but write the newest (i.e. the last) paymentId to the database
        const { error } = await supabase.from("connections").update({ last_processed_payment: recentPayments[recentPayments.length - 1].id }).eq('id', newestConnection.id)

        if (error)
            console.log(error)
    }

    const newPayments = getAllNewPayments(recentPayments, lastProcessedPaymentId)

    // if no new pay statements, then don't create file
    if (!newPayments)
        return

    // get the Finch pay statements for all new payments
    const payStatements = (await finch.hris.payStatements.retrieveMany({
        requests: newPayments.map(payment => {
            return { payment_id: payment.payment_id }
        })
    })).responses as FinchPayStatementRes[]

    // For each pay-statement, match the individual pay-statements with the payment details
    payStatements.forEach(response => {
        var payment = newPayments.find(payment => payment.payment_id === response.payment_id)
        if (payment)
            payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
    })

    // get the company directory from Finch
    const individuals = (await finch.hris.directory.list()).individuals as FinchEmployee[]

    const csv = convertPayrollToFile(individuals, newPayments)

    try {
        await sftpClient.putCSV(csv, `/${customer.customer_name}/finch-${companyId}-${newestConnection.provider_id}-payroll-${moment().format('YYYY-MM-DD')}.csv`); // could include payDate if broken out by each file
        console.log('File uploaded via SFTP successfully');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function handleTestDataSync() {
    const connection = {
        customer_id: "00000000-0000-0000-0000-000000000001",
        company_id: "00000000-0000-0000-0000-000000000002",
        provider_id: "finch"
    }
    const customer = {
        customer_name: "Test Sponsor",
        company_id: "00000000-0000-0000-0000-000000000002",
        plan_id: "1234567890"
    }
    const payDate = "2023-9-31"
    // Possible Payment Ids in recentPayments
    //
    // 5c7ca37d-c3ff-4fe5-ab9b-ff51a8362803
    // f2e255f7-efb2-4d3e-aaeb-49f70c671888
    // 2a7f754a-9cfd-4c4f-97a3-4094048398a1
    // db5c608c-14fa-4bdd-a45b-48552540e9d4
    //
    const recentPayments: FinchPayment[] = [
        {
            "id": "5c7ca37d-c3ff-4fe5-ab9b-ff51a8362803",
            "pay_period": {
                "start_date": "2023-08-01",
                "end_date": "2023-08-15"
            },
            "pay_date": "2023-08-16",
            "debit_date": "2023-08-16",
            "company_debit": {
                "amount": 5414337,
                "currency": "usd"
            },
            "gross_pay": {
                "amount": 4845460,
                "currency": "usd"
            },
            "net_pay": {
                "amount": 2009693,
                "currency": "usd"
            },
            "employee_taxes": {
                "amount": 2549475,
                "currency": "usd"
            },
            "employer_taxes": {
                "amount": 370675,
                "currency": "usd"
            },
            "individual_ids": [
                "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
                "18331045-7de3-4d89-8d49-9ba12e0e6bab",
                "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
                "a7087c91-e6bc-4286-acc5-4cbd61708d92",
                "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
                "2a707d3f-aa82-41a9-9050-823abfa5b832",
                "6f977244-4880-4dde-b355-69c8bff43123",
                "09581c75-69a2-4cbd-b515-30b0e8d617a9",
                "e9f80887-78ad-4999-8708-0d2cc09a20cc",
                "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
                "919331a2-a8b9-4d35-bc0f-b8253e196192"
            ]
        },
        {
            "id": "f2e255f7-efb2-4d3e-aaeb-49f70c671888",
            "pay_period": {
                "start_date": "2023-08-16",
                "end_date": "2023-08-31"
            },
            "pay_date": "2023-09-01",
            "debit_date": "2023-09-01",
            "company_debit": {
                "amount": 5339954,
                "currency": "usd"
            },
            "gross_pay": {
                "amount": 4782831,
                "currency": "usd"
            },
            "net_pay": {
                "amount": 2016505,
                "currency": "usd"
            },
            "employee_taxes": {
                "amount": 2490100,
                "currency": "usd"
            },
            "employer_taxes": {
                "amount": 365889,
                "currency": "usd"
            },
            "individual_ids": [
                "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
                "18331045-7de3-4d89-8d49-9ba12e0e6bab",
                "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
                "a7087c91-e6bc-4286-acc5-4cbd61708d92",
                "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
                "2a707d3f-aa82-41a9-9050-823abfa5b832",
                "6f977244-4880-4dde-b355-69c8bff43123",
                "09581c75-69a2-4cbd-b515-30b0e8d617a9",
                "e9f80887-78ad-4999-8708-0d2cc09a20cc",
                "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
                "919331a2-a8b9-4d35-bc0f-b8253e196192"
            ]
        },
        {
            "id": "2a7f754a-9cfd-4c4f-97a3-4094048398a1",
            "pay_period": {
                "start_date": "2023-09-01",
                "end_date": "2023-09-15"
            },
            "pay_date": "2023-09-16",
            "debit_date": "2023-09-16",
            "company_debit": {
                "amount": 6961209,
                "currency": "usd"
            },
            "gross_pay": {
                "amount": 6218237,
                "currency": "usd"
            },
            "net_pay": {
                "amount": 2441842,
                "currency": "usd"
            },
            "employee_taxes": {
                "amount": 3390334,
                "currency": "usd"
            },
            "employer_taxes": {
                "amount": 475696,
                "currency": "usd"
            },
            "individual_ids": [
                "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
                "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f",
                "18331045-7de3-4d89-8d49-9ba12e0e6bab",
                "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
                "a7087c91-e6bc-4286-acc5-4cbd61708d92",
                "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
                "2a707d3f-aa82-41a9-9050-823abfa5b832",
                "6f977244-4880-4dde-b355-69c8bff43123",
                "09581c75-69a2-4cbd-b515-30b0e8d617a9",
                "e9f80887-78ad-4999-8708-0d2cc09a20cc",
                "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
                "919331a2-a8b9-4d35-bc0f-b8253e196192"
            ]
        },
        {
            "id": "db5c608c-14fa-4bdd-a45b-48552540e9d4",
            "pay_period": {
                "start_date": "2023-09-16",
                "end_date": "2023-09-30"
            },
            "pay_date": "2023-10-01",
            "debit_date": "2023-10-01",
            "company_debit": {
                "amount": 6861696,
                "currency": "usd"
            },
            "gross_pay": {
                "amount": 6124304,
                "currency": "usd"
            },
            "net_pay": {
                "amount": 2383489,
                "currency": "usd"
            },
            "employee_taxes": {
                "amount": 3352425,
                "currency": "usd"
            },
            "employer_taxes": {
                "amount": 468508,
                "currency": "usd"
            },
            "individual_ids": [
                "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
                "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f",
                "18331045-7de3-4d89-8d49-9ba12e0e6bab",
                "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
                "a7087c91-e6bc-4286-acc5-4cbd61708d92",
                "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
                "2a707d3f-aa82-41a9-9050-823abfa5b832",
                "6f977244-4880-4dde-b355-69c8bff43123",
                "09581c75-69a2-4cbd-b515-30b0e8d617a9",
                "e9f80887-78ad-4999-8708-0d2cc09a20cc",
                "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
                "919331a2-a8b9-4d35-bc0f-b8253e196192"
            ]
        }
    ]
    const lastProcessedPaymentId = "2a7f754a-9cfd-4c4f-97a3-4094048398a1"
    // pay statement for db5c608c-14fa-4bdd-a45b-48552540e9d4
    const payStatements: FinchPayStatementRes[] = [{
        "payment_id": "db5c608c-14fa-4bdd-a45b-48552540e9d4",
        "code": 200,
        "body": {
            "paging": {
                "count": 12,
                "offset": 0
            },
            "pay_statements": [
                {
                    "individual_id": "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 251130,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 139000,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 251130,
                            "currency": "usd",
                            "hours": 66
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 55249,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 37670,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 15570,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 3641,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 15570,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 3641,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                },
                {
                    "individual_id": "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 140742,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 91975,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 140742,
                            "currency": "usd",
                            "hours": 63
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 30963,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 7037,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 8726,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 2041,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 8726,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 2041,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                },
                {
                    "individual_id": "2a707d3f-aa82-41a9-9050-823abfa5b832",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 142978,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 93436,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 142978,
                            "currency": "usd",
                            "hours": 67
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 31455,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 7149,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 8865,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 2073,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 8865,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 2073,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                },
                {
                    "individual_id": "6f977244-4880-4dde-b355-69c8bff43123",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 313931,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 164970,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 285481,
                            "currency": "usd",
                            "hours": 80
                        },
                        {
                            "name": "Bonus",
                            "type": "bonus",
                            "amount": 28450,
                            "currency": "usd",
                            "hours": 0
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 69065,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 31393,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 19464,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 4552,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 19464,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 4552,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 18836,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 3139,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 1884,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 628,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "09581c75-69a2-4cbd-b515-30b0e8d617a9",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 262724,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 158555,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 262724,
                            "currency": "usd",
                            "hours": 77
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 57799,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 26272,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 16289,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 3809,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 16289,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 3809,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                },
                {
                    "individual_id": "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 1038278,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 306810,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Double overtime",
                            "type": "double_overtime",
                            "amount": 53448,
                            "currency": "usd",
                            "hours": 4
                        },
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 964993,
                            "currency": "usd",
                            "hours": 80
                        },
                        {
                            "name": "Bonus",
                            "type": "bonus",
                            "amount": 19837,
                            "currency": "usd",
                            "hours": 0
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 363397,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 207656,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 64373,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 15055,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 64373,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 15055,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 62297,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 10383,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 6230,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 2077,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "919331a2-a8b9-4d35-bc0f-b8253e196192",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 178488,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 107718,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 178488,
                            "currency": "usd",
                            "hours": 74
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 39267,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 17849,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 11066,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 2588,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 11066,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 2588,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                },
                {
                    "individual_id": "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 747247,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 303011,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 703877,
                            "currency": "usd",
                            "hours": 80
                        },
                        {
                            "name": "Paycheck Tips",
                            "type": "tips",
                            "amount": 43370,
                            "currency": "usd",
                            "hours": 0
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 179339,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 149449,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 46329,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 10835,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 46329,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 10835,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 44835,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 7472,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 4483,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 1494,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 1337593,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 395257,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 1239803,
                            "currency": "usd",
                            "hours": 80
                        },
                        {
                            "name": "Paycheck Tips",
                            "type": "tips",
                            "amount": 34848,
                            "currency": "usd",
                            "hours": 0
                        },
                        {
                            "name": "Life Insurance",
                            "type": "other",
                            "amount": 62942,
                            "currency": "usd",
                            "hours": 0
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 468158,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 267519,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 82931,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 19395,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 82931,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 19395,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 80256,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 13376,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 8026,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 2675,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "18331045-7de3-4d89-8d49-9ba12e0e6bab",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 1027466,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 303616,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 1027466,
                            "currency": "usd",
                            "hours": 80
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 359613,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 205493,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 63703,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 14898,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 63703,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 14898,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 61648,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 10275,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 6165,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 2055,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "a7087c91-e6bc-4286-acc5-4cbd61708d92",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 514818,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 208758,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": null,
                            "amount": 463018,
                            "currency": "usd",
                            "hours": 80
                        },
                        {
                            "name": "Bonus",
                            "type": "bonus",
                            "amount": 30257,
                            "currency": "usd",
                            "hours": 0
                        },
                        {
                            "name": "Life Insurance",
                            "type": "other",
                            "amount": 21543,
                            "currency": "usd",
                            "hours": 0
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 123556,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 102964,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 31919,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 7465,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 31919,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 7465,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [
                        {
                            "type": "401k",
                            "name": "401(k) plan %",
                            "amount": 30889,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_medical",
                            "name": "MED PRE TAX",
                            "amount": 5148,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_dental",
                            "name": "DEN PRE TAX",
                            "amount": 3089,
                            "currency": "usd",
                            "pre_tax": true
                        },
                        {
                            "type": "s125_vision",
                            "name": "VIS PRE TAX",
                            "amount": 1030,
                            "currency": "usd",
                            "pre_tax": true
                        }
                    ],
                    "employer_contributions": null
                },
                {
                    "individual_id": "e9f80887-78ad-4999-8708-0d2cc09a20cc",
                    "type": "regular_payroll",
                    "payment_method": "direct_deposit",
                    "total_hours": null,
                    "gross_pay": {
                        "amount": 168909,
                        "currency": "usd"
                    },
                    "net_pay": {
                        "amount": 110383,
                        "currency": "usd"
                    },
                    "earnings": [
                        {
                            "name": "Regular",
                            "type": "1099",
                            "amount": 168909,
                            "currency": "usd",
                            "hours": 71
                        }
                    ],
                    "taxes": [
                        {
                            "type": "federal",
                            "name": "Federal Income Tax",
                            "employer": false,
                            "amount": 37160,
                            "currency": "usd"
                        },
                        {
                            "type": "state",
                            "name": "State Income Tax",
                            "employer": false,
                            "amount": 8445,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI)",
                            "employer": false,
                            "amount": 10472,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare",
                            "employer": false,
                            "amount": 2449,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Social Security (OASDI) - Employer",
                            "employer": true,
                            "amount": 10472,
                            "currency": "usd"
                        },
                        {
                            "type": "fica",
                            "name": "Medicare - Employer",
                            "employer": true,
                            "amount": 2449,
                            "currency": "usd"
                        }
                    ],
                    "employee_deductions": [],
                    "employer_contributions": null
                }
            ]
        }
    }]

    // should return [ "db5c608c-14fa-4bdd-a45b-48552540e9d4" ]
    const newPayments = getAllNewPayments(recentPayments, lastProcessedPaymentId)
    //console.log(newPayments)

    // For each pay-statement, match the individual pay-statements with the payment details
    payStatements.forEach(response => {
        var payment = newPayments.find(payment => payment.payment_id === response.payment_id)
        if (payment)
            payment.pay_statements = response.body.pay_statements // there is a payment_id match, update the pay_statements with the pay_date
    })

    const individuals: FinchEmployee[] = [
        {
            "id": "e7ac2282-f1bf-4fd6-ad8d-4741835e28ce",
            "first_name": "Margie",
            "middle_name": "Vera",
            "last_name": "Barrows",
            "manager": {
                "id": "18331045-7de3-4d89-8d49-9ba12e0e6bab"
            },
            "department": {
                "name": "Program"
            },
            "is_active": false
        },
        {
            "id": "5be6ae3f-704d-4efa-8d31-978b279f7afb",
            "first_name": "Stacey",
            "middle_name": "Diana",
            "last_name": "Brakus",
            "manager": {
                "id": "a7087c91-e6bc-4286-acc5-4cbd61708d92"
            },
            "department": {
                "name": "Program"
            },
            "is_active": false
        },
        {
            "id": "a16c8b76-173c-4963-8c62-76bc80ffb656",
            "first_name": "Victoria",
            "middle_name": "Thea",
            "last_name": "Christiansen",
            "manager": {
                "id": "de32327b-3169-42a7-8852-3bfa7364375d"
            },
            "department": {
                "name": "Factors"
            },
            "is_active": false
        },
        {
            "id": "c86c6719-6faa-4f53-8bcf-652fc0768e86",
            "first_name": "Beulah",
            "middle_name": "Zaylee",
            "last_name": "Cremin",
            "manager": {
                "id": "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f"
            },
            "department": {
                "name": "Program"
            },
            "is_active": false
        },
        {
            "id": "919331a2-a8b9-4d35-bc0f-b8253e196192",
            "first_name": "Nick",
            "middle_name": "Monroe",
            "last_name": "Franey",
            "manager": {
                "id": "a59707b3-9fd8-4c07-b005-b0bc4dfad82b"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "8a032e3e-20e7-47f3-875a-af480ea963f0",
            "first_name": "Al",
            "middle_name": "August",
            "last_name": "Gleichner",
            "manager": {
                "id": "e7ac2282-f1bf-4fd6-ad8d-4741835e28ce"
            },
            "department": {
                "name": "Program"
            },
            "is_active": false
        },
        {
            "id": "728487a0-3aed-418e-9121-99bf769fb16d",
            "first_name": "Kristopher",
            "middle_name": "Ethan",
            "last_name": "Hagenes",
            "manager": {
                "id": "0d7b3503-d379-4cd8-b2b9-c69638cd7052"
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": false
        },
        {
            "id": "a7087c91-e6bc-4286-acc5-4cbd61708d92",
            "first_name": "Eduardo",
            "middle_name": "Monroe",
            "last_name": "Hansen",
            "manager": {
                "id": "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "de32327b-3169-42a7-8852-3bfa7364375d",
            "first_name": "Alton",
            "middle_name": "Harrison",
            "last_name": "Labadie",
            "manager": {
                "id": null
            },
            "department": {
                "name": "Factors"
            },
            "is_active": false
        },
        {
            "id": "60ed33cb-47c6-46e1-90e0-cca78e1e2641",
            "first_name": "Ann",
            "middle_name": "Ruth",
            "last_name": "Lemke",
            "manager": {
                "id": "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "2a34aae4-d2ed-4f3b-9a23-6f0689e8ea4d",
            "first_name": "Laurence",
            "middle_name": "Daniel",
            "last_name": "Mante",
            "manager": {
                "id": "0d7b3503-d379-4cd8-b2b9-c69638cd7052"
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": true
        },
        {
            "id": "90a563e8-f8e9-4fbe-bc04-7c6fcfd8bf8f",
            "first_name": "Lynne",
            "middle_name": "Alisha",
            "last_name": "McLaughlin",
            "manager": {
                "id": null
            },
            "department": {
                "name": "Program"
            },
            "is_active": false
        },
        {
            "id": "09581c75-69a2-4cbd-b515-30b0e8d617a9",
            "first_name": "Yolanda",
            "middle_name": "Skylar",
            "last_name": "Monahan",
            "manager": {
                "id": "e7ac2282-f1bf-4fd6-ad8d-4741835e28ce"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "0d7b3503-d379-4cd8-b2b9-c69638cd7052",
            "first_name": "Celia",
            "middle_name": "Candice",
            "last_name": "Mraz",
            "manager": {
                "id": null
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": true
        },
        {
            "id": "18331045-7de3-4d89-8d49-9ba12e0e6bab",
            "first_name": "Nathaniel",
            "middle_name": "Sebastian",
            "last_name": "Murphy",
            "manager": {
                "id": "c86c6719-6faa-4f53-8bcf-652fc0768e86"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "6f977244-4880-4dde-b355-69c8bff43123",
            "first_name": "Minnie",
            "middle_name": "Zion",
            "last_name": "Rowe",
            "manager": {
                "id": "a16c8b76-173c-4963-8c62-76bc80ffb656"
            },
            "department": {
                "name": "Factors"
            },
            "is_active": false
        },
        {
            "id": "a59707b3-9fd8-4c07-b005-b0bc4dfad82b",
            "first_name": "Benjamin",
            "middle_name": "Benjamin",
            "last_name": "Runolfsson",
            "manager": {
                "id": "c86c6719-6faa-4f53-8bcf-652fc0768e86"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "3f6a2842-1d71-404c-b3a4-b852af64b6df",
            "first_name": "Flora",
            "middle_name": "Josie",
            "last_name": "Schaden",
            "manager": {
                "id": "728487a0-3aed-418e-9121-99bf769fb16d"
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": false
        },
        {
            "id": "2a707d3f-aa82-41a9-9050-823abfa5b832",
            "first_name": "Kelly",
            "middle_name": "Cia",
            "last_name": "VonRueden",
            "manager": {
                "id": "0d7b3503-d379-4cd8-b2b9-c69638cd7052"
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": true
        },
        {
            "id": "e9f80887-78ad-4999-8708-0d2cc09a20cc",
            "first_name": "Abraham",
            "middle_name": "Teddy",
            "last_name": "White",
            "manager": {
                "id": "60ed33cb-47c6-46e1-90e0-cca78e1e2641"
            },
            "department": {
                "name": "Program"
            },
            "is_active": true
        },
        {
            "id": "d2e1d9bf-52cb-4b61-a09d-b8203d93e91b",
            "first_name": "Jeanne",
            "middle_name": "Harley",
            "last_name": "Wiza",
            "manager": {
                "id": "2a707d3f-aa82-41a9-9050-823abfa5b832"
            },
            "department": {
                "name": "Mobility"
            },
            "is_active": false
        }
    ]

    const csv = convertPayrollToFile(individuals, newPayments)

    try {
        await sftpClient.putCSV(csv, `/${customer.customer_name}/finch-${connection.company_id}-${connection.provider_id}-payroll-${moment().format('YYYY-MM-DD')}.csv`);
        console.log('File uploaded via SFTP successfully');
    } catch (error) {
        console.error('An error occurred:', error);
    }

}

export default { handleNewDataSync, handleTestDataSync }

function getAllNewPayments(payments: FinchPayment[], lastProcessedPaymentId: string): PayData[] {
    let foundLastProcessed = false;

    // Assuming that if lastProcessedPaymentId is not found, all payments are new
    if (!payments.some(payment => payment.id === lastProcessedPaymentId)) {
        foundLastProcessed = true;
    }

    const results: PayData[] = [];

    for (const payment of payments) {
        if (foundLastProcessed) {
            results.push({
                payment_id: payment.id,
                pay_date: payment.pay_date,
                pay_statements: [] // we will add this later once we call the /pay-statements endpoint
            });
        }

        if (payment.id === lastProcessedPaymentId) {
            foundLastProcessed = true;
        }
    }

    return results;
}

// TODO: This ultimately needs to convert each paymentId into separate files, the return string[] of csv files
// right now, it just takes all the pay data and puts it into a single file, but still broken down by pay date
function convertPayrollToFile(DirectoryJson: FinchEmployee[], PayDataJson: PayData[]): string {
    const headers = [
        "Individual ID",
        "Name",
        "Payment Date",
        "Payment Type",
        "Total Hours",
        "Gross Pay",
        "Net Pay",
        "Earnings_salary",
        "Earnings_wage",
        "Earnings_1099",
        "Earnings_overtime",
        "Earnings_reimbursement",
        "Earnings_severance",
        "Earnings_double_overtime",
        "Earnings_pto",
        "Earnings_sick",
        "Earnings_bonus",
        "Earnings_commission",
        "Earnings_tips",
        "Earnings_other",
        "Earnings_null",
        "Total Earnings",
        "Taxes_federal",
        "Taxes_state",
        "Taxes_local",
        "Taxes_fica",
        "Taxes_null",
        "Total Taxes",
        "Deductions_401k",
        "Deductions_401k_roth",
        "Deductions_401k_loan",
        "Deductions_403b",
        "Deductions_403b_roth",
        "Deductions_457",
        "Deductions_457_roth",
        "Deductions_s125_medical",
        "Deductions_s125_dental",
        "Deductions_s125_vision",
        "Deductions_hsa_pre",
        "Deductions_hsa_post",
        "Deductions_fsa_medical",
        "Deductions_fsa_dependent_care",
        "Deductions_simple_ira",
        "Deductions_simple",
        "Deductions_commuter",
        "Deductions_custom_pre_tax",
        "Deductions_custom_post_tax",
        "Deductions_null",
        "Total Deductions",
        "Contributions_401k",
        "Contributions_401k_roth",
        "Contributions_401k_loan",
        "Contributions_403b",
        "Contributions_403b_roth",
        "Contributions_457",
        "Contributions_457_roth",
        "Contributions_s125_medical",
        "Contributions_s125_dental",
        "Contributions_s125_vision",
        "Contributions_hsa_pre",
        "Contributions_hsa_post",
        "Contributions_fsa_medical",
        "Contributions_fsa_dependent_care",
        "Contributions_simple_ira",
        "Contributions_simple",
        "Contributions_commuter",
        "Contributions_custom_pre_tax",
        "Contributions_custom_post_tax",
        "Contributions_null",
        "Total Contributions"

    ]

    let rows = []
    rows.push(headers)

    PayDataJson.forEach(payment => {
        const individual_paychecks = payment.pay_statements
        individual_paychecks.forEach(paycheck => {
            const employee = DirectoryJson.find(employee => employee.id === paycheck.individual_id)

            rows.push([
                employee?.id,
                employee?.first_name + ' ' + employee?.last_name,
                payment?.pay_date,
                paycheck?.type,
                paycheck?.total_hours,
                paycheck?.gross_pay.amount,
                paycheck?.net_pay.amount,
                sumAmountsInType(paycheck.earnings, 'salary'),
                sumAmountsInType(paycheck.earnings, 'wage'),
                sumAmountsInType(paycheck.earnings, '1099'),
                sumAmountsInType(paycheck.earnings, 'overtime'),
                sumAmountsInType(paycheck.earnings, 'reimbursement'),
                sumAmountsInType(paycheck.earnings, 'severance'),
                sumAmountsInType(paycheck.earnings, 'double_overtime'),
                sumAmountsInType(paycheck.earnings, 'pto'),
                sumAmountsInType(paycheck.earnings, 'sick'),
                sumAmountsInType(paycheck.earnings, 'bonus'),
                sumAmountsInType(paycheck.earnings, 'commission'),
                sumAmountsInType(paycheck.earnings, 'tips'),
                sumAmountsInType(paycheck.earnings, 'other'),
                sumAmountsInType(paycheck.earnings, null),
                sumTotal(paycheck.earnings),
                sumAmountsInType(paycheck.taxes, 'federal'),
                sumAmountsInType(paycheck.earnings, 'state'),
                sumAmountsInType(paycheck.earnings, 'local'),
                sumAmountsInType(paycheck.earnings, 'fica'),
                sumAmountsInType(paycheck.earnings, null),
                sumTotal(paycheck.taxes),
                sumAmountsInType(paycheck.employee_deductions, '401k'),
                sumAmountsInType(paycheck.employee_deductions, '401k_roth'),
                sumAmountsInType(paycheck.employee_deductions, '401k_loan'),
                sumAmountsInType(paycheck.employee_deductions, '403b'),
                sumAmountsInType(paycheck.employee_deductions, '403b_roth'),
                sumAmountsInType(paycheck.employee_deductions, '457'),
                sumAmountsInType(paycheck.employee_deductions, '457_roth'),
                sumAmountsInType(paycheck.employee_deductions, 's125_medical'),
                sumAmountsInType(paycheck.employee_deductions, 's125_dental'),
                sumAmountsInType(paycheck.employee_deductions, 's125_vision'),
                sumAmountsInType(paycheck.employee_deductions, 'hsa_pre'),
                sumAmountsInType(paycheck.employee_deductions, 'hsa_post'),
                sumAmountsInType(paycheck.employee_deductions, 'fsa_medical'),
                sumAmountsInType(paycheck.employee_deductions, 'fsa_dependent_care'),
                sumAmountsInType(paycheck.employee_deductions, 'simple_ira'),
                sumAmountsInType(paycheck.employee_deductions, 'simple'),
                sumAmountsInType(paycheck.employee_deductions, 'commuter'),
                sumAmountsInType(paycheck.employee_deductions, 'custom_pre_tax'),
                sumAmountsInType(paycheck.employee_deductions, 'custom_post_tax'),
                sumAmountsInType(paycheck.employee_deductions, null),
                sumTotal(paycheck.employee_deductions),
                sumAmountsInType(paycheck.employer_contributions, '401k'),
                sumAmountsInType(paycheck.employer_contributions, '401k_roth'),
                sumAmountsInType(paycheck.employer_contributions, '401k_loan'),
                sumAmountsInType(paycheck.employer_contributions, '403b'),
                sumAmountsInType(paycheck.employer_contributions, '403b_roth'),
                sumAmountsInType(paycheck.employer_contributions, '457'),
                sumAmountsInType(paycheck.employer_contributions, '457_roth'),
                sumAmountsInType(paycheck.employer_contributions, 's125_medical'),
                sumAmountsInType(paycheck.employer_contributions, 's125_dental'),
                sumAmountsInType(paycheck.employer_contributions, 's125_vision'),
                sumAmountsInType(paycheck.employer_contributions, 'hsa_pre'),
                sumAmountsInType(paycheck.employer_contributions, 'hsa_post'),
                sumAmountsInType(paycheck.employer_contributions, 'fsa_medical'),
                sumAmountsInType(paycheck.employer_contributions, 'fsa_dependent_care'),
                sumAmountsInType(paycheck.employer_contributions, 'simple_ira'),
                sumAmountsInType(paycheck.employer_contributions, 'simple'),
                sumAmountsInType(paycheck.employer_contributions, 'commuter'),
                sumAmountsInType(paycheck.employer_contributions, 'custom_pre_tax'),
                sumAmountsInType(paycheck.employer_contributions, 'custom_post_tax'),
                sumAmountsInType(paycheck.employer_contributions, null),
                sumTotal(paycheck.employer_contributions),
            ])
        })
    })

    // Convert array to csv comma delimited string
    let csvString = rows.map(row => row.join(',')).join('\n')

    return csvString

}

function sumAmountsInType(array: any[] | null, type: string | null) {
    var total = 0

    if (!array)
        return total

    array.forEach(element => {
        if (element?.type === type)
            total += element?.amount
    })
    return total
}

function sumTotal(array: any[] | null) {
    var total = 0
    if (!array)
        return total

    array.forEach(element => {
        total += element?.amount
    })
    return total
}
