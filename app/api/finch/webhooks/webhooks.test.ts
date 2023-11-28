const util = require('./util')

// TODO: finch.ts ->  getFinchData & validateFinchData

// sumAmountsForType tests
test('Array does not exist', () => {
    const deductions = null
    const amount = util.sumAmountsForType(deductions, 'test')
    expect(amount).toEqual(undefined)
})
test('field does not exist', () => {
    const deductions = [
        {
            "type": "401k",
            "name": "401(k) plan %",
            "amount": 64026,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_medical",
            "name": "MED PRE TAX",
            "amount": 10671,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_dental",
            "name": "DEN PRE TAX",
            "amount": 6403,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_vision",
            "name": "VIS PRE TAX",
            "amount": 2134,
            "currency": "usd",
            "pre_tax": true
        }
    ]
    const amount = util.sumAmountsForType(constants.paycheck.employee_deductions, 'test')
    expect(amount).toEqual(undefined)
})
test('Sum single type in array', () => {
    const deductions = [
        {
            "type": "401k",
            "name": "401(k) plan %",
            "amount": 64026,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_medical",
            "name": "MED PRE TAX",
            "amount": 10671,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_dental",
            "name": "DEN PRE TAX",
            "amount": 6403,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_vision",
            "name": "VIS PRE TAX",
            "amount": 2134,
            "currency": "usd",
            "pre_tax": true
        }
    ]
    const amount = util.sumAmountsForType(constants.paycheck.employee_deductions, '401k')
    expect(amount).toEqual(64026)
})
test('Sum multiple types in array', () => {
    const deductions = [
        {
            "type": "401k",
            "name": "1",
            "amount": 64026,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "401k",
            "name": "2",
            "amount": 10671,
            "currency": "usd",
            "pre_tax": true
        },
        {
            "type": "s125_dental",
            "name": "other",
            "amount": 6403,
            "currency": "usd",
            "pre_tax": true
        },
    ]
    const amount = util.sumAmountsForType(deductions, '401k')
    expect(amount).toEqual(74697)
})


// findFieldAmount tests
test('paycheck does not exist', () => {
    const paycheck = null
    const amount = util.findFieldAmount(paycheck, '401k', 'contributions')
    expect(amount).toEqual(undefined)
})
test('field does not exist', () => {
    const amount = util.findFieldAmount(constants.paycheck, 'test')
    expect(amount).toEqual(undefined)
})
test('field does not exist in contributions', () => {
    const amount = util.findFieldAmount(constants.paycheck, 'test', 'contributions')
    expect(amount).toEqual(undefined)
})
test('find field 401k in deductions', () => {
    const amount = util.findFieldAmount(constants.paycheck, '401k', 'deductions')
    expect(amount).toEqual(64026)
})
test('find field 401k in contributions', () => {
    const amount = util.findFieldAmount(constants.paycheck, '401k', 'contributions')
    expect(amount).toEqual(32013)
})
test('find field 401k, category not specified', () => {
    const amount = util.findFieldAmount(constants.paycheck, '401k')
    expect(amount).toEqual(undefined)
})

// calcIndividualYtdByField tests
// checks for ytdPayStatements: FinchPayStatement[] happen in ./finch.ts -> validateFinchData
test('Individual Id does not exist in pay statements', () => {
    const amount = util.calcIndividualYtdByField('000', 'gross_pay', constants.ytd)
    expect(amount).toEqual(0)
})
test('Individual is null', () => {
    const amount = util.calcIndividualYtdByField(null, 'gross_pay', constants.ytd)
    expect(amount).toEqual(0)
})
test('field does not exist', () => {
    const amount = util.calcIndividualYtdByField('07a005c3-321a-4deb-8099-6edaacdc78d4', 'testing', constants.ytd)
    expect(amount).toEqual(0)
})
test('calc YTD for field 401k in deductions', () => {
    const amount = util.calcIndividualYtdByField('07a005c3-321a-4deb-8099-6edaacdc78d4', '401k', constants.ytd, 'deductions')
    expect(amount).toEqual(64026 + 65274)
})
test('calc YTD for field gross_pay, category not specified', () => {
    const amount = util.calcIndividualYtdByField('07a005c3-321a-4deb-8099-6edaacdc78d4', 'gross_pay', constants.ytd)
    expect(amount).toEqual(1067101 + 1087904)
})


const constants = {
    paycheck: {
        "individual_id": "07a005c3-321a-4deb-8099-6edaacdc78d4",
        "type": "regular_payroll",
        "payment_method": "direct_deposit",
        "total_hours": 80,
        "gross_pay": {
            "amount": 1067101,
            "currency": "usd"
        },
        "net_pay": {
            "amount": 315329,
            "currency": "usd"
        },
        "earnings": [
            {
                "name": "REGULAR",
                "type": "wage",
                "amount": 1067101,
                "currency": "usd",
                "hours": 80
            }
        ],
        "taxes": [
            {
                "type": "federal",
                "name": "Federal Income Tax",
                "employer": false,
                "amount": 373485,
                "currency": "usd"
            },
            {
                "type": "state",
                "name": "State Income Tax",
                "employer": false,
                "amount": 213420,
                "currency": "usd"
            },
            {
                "type": "fica",
                "name": "Social Security (OASDI)",
                "employer": false,
                "amount": 66160,
                "currency": "usd"
            },
            {
                "type": "fica",
                "name": "Medicare",
                "employer": false,
                "amount": 15473,
                "currency": "usd"
            },
            {
                "type": "fica",
                "name": "Social Security (OASDI) - Employer",
                "employer": true,
                "amount": 66160,
                "currency": "usd"
            },
            {
                "type": "fica",
                "name": "Medicare - Employer",
                "employer": true,
                "amount": 15473,
                "currency": "usd"
            }
        ],
        "employee_deductions": [
            {
                "type": "401k",
                "name": "401(k) plan %",
                "amount": 64026,
                "currency": "usd",
                "pre_tax": true
            },
            {
                "type": "s125_medical",
                "name": "MED PRE TAX",
                "amount": 10671,
                "currency": "usd",
                "pre_tax": true
            },
            {
                "type": "s125_dental",
                "name": "DEN PRE TAX",
                "amount": 6403,
                "currency": "usd",
                "pre_tax": true
            },
            {
                "type": "s125_vision",
                "name": "VIS PRE TAX",
                "amount": 2134,
                "currency": "usd",
                "pre_tax": true
            }
        ],
        "employer_contributions": [
            {
                "type": "401k",
                "name": "401(k) Employer",
                "amount": 32013,
                "currency": "usd"
            },
            {
                "type": "s125_medical",
                "name": "MED Employer",
                "amount": 12805,
                "currency": "usd"
            },
            {
                "type": "s125_dental",
                "name": "DEN Employer",
                "amount": 8537,
                "currency": "usd"
            },
            {
                "type": "s125_vision",
                "name": "VIS Employer",
                "amount": 4268,
                "currency": "usd"
            }
        ]
    },
    ytd: [
        {
            "payment_id": "4704a7c2-2b80-4c9d-9853-0ec5db9c8ac0",
            "code": 200,
            "body": {
                "paging": {
                    "count": 14,
                    "offset": 0
                },
                "pay_statements": [
                    {
                        "individual_id": "07a005c3-321a-4deb-8099-6edaacdc78d4",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1067101,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 315329,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1067101,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 373485,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 213420,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 66160,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 15473,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 66160,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 15473,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 64026,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 10671,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 6403,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2134,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 32013,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 12805,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 8537,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 4268,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "c075169c-d0df-4464-96f6-3ae42e9198ea",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 507445,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 205768,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 483810,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Bonus",
                                "type": "bonus",
                                "amount": 23635,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 121787,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 101489,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 31462,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 7358,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 31462,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 7358,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 30447,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 5074,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 3045,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1015,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 15223,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 6089,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 4060,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 2030,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "79138355-6caa-473e-a501-7f859fdaa1b0",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 647324,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 262490,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 647324,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 155358,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 129465,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 40134,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 9386,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 40134,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 9386,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 38839,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 6473,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 3884,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1295,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 19420,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 7768,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 5179,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 2589,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "e241c2d8-bcd5-48ac-a3fa-23f6ac0fd9fb",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 838903,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 273063,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 769063,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "PTO",
                                "type": null,
                                "amount": 69840,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 268449,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 167781,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 52012,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 12164,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 52012,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 12164,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 50334,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 8389,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 5033,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1678,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 25167,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 10067,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 6711,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 3356,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "3c240dce-836a-477a-8329-0d1d3ff25f55",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 72,
                        "gross_pay": {
                            "amount": 185184,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 111760,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 185184,
                                "currency": "usd",
                                "hours": 72
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 40740,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 18518,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 11481,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 2685,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 11481,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 2685,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "83c4cf71-180d-43dc-a63d-3930b44cf9e8",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1206768,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 356598,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1167844,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Tips",
                                "type": "tips",
                                "amount": 38924,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 422369,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 241354,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 74820,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 17498,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 74820,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 17498,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 72406,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 12068,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 7241,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2414,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 36203,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 14481,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 9654,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 4827,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a905b6e7-4b84-4c19-9f27-e25d7227b41a",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 333716,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 175368,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 309400,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Supplemental pay: Commission",
                                "type": "commission",
                                "amount": 24316,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 73418,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 33372,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 20690,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4839,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 20690,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4839,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 20023,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 3337,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 2002,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 667,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 10011,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 4005,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 2670,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 1335,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "363d1476-a627-4831-8af3-9ed6bdbe8dff",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 501838,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 203495,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 461571,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Supplemental pay: Other",
                                "type": "other",
                                "amount": 40267,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 120441,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 100368,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 31114,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 7277,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 31114,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 7277,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 30110,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 5018,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 3011,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1004,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 15055,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 6022,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 4015,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 2007,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a34f20d9-ab29-4b6b-97dc-86164c5a7301",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1075120,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 317699,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1075120,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 376292,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 215024,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 66657,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 15589,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 66657,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 15589,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 64507,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 10751,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 6451,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2150,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 32254,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 12901,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 8601,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 4300,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a94cb69d-a4be-468a-a9f6-8f0152cbc318",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 305532,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 160558,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 285169,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Separation Pay One Time",
                                "type": "severance",
                                "amount": 20363,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 67217,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 30553,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 18943,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4430,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 18943,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4430,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 18332,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 3055,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 1833,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 611,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 9166,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 3666,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 2444,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 1222,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "4b44d236-b896-4021-a185-3ee22a262865",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 905085,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 267452,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 870237,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Separation Pay One Time",
                                "type": "severance",
                                "amount": 34848,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 316780,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 181017,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 56115,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 13124,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 56115,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 13124,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 54305,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 9051,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 5431,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1810,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 27153,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 10861,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 7241,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 3620,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "c679f22e-c012-4cb8-924f-5d83b53cdb12",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 81,
                        "gross_pay": {
                            "amount": 292726,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 176659,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Overtime",
                                "type": "overtime",
                                "amount": 4326,
                                "currency": "usd",
                                "hours": 1
                            },
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 288400,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 64400,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 29273,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 18149,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4245,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 18149,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4245,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "ee6d751e-835c-46e6-a157-931872e0efb6",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 87,
                        "gross_pay": {
                            "amount": 322837,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 178690,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Overtime",
                                "type": "overtime",
                                "amount": 30677,
                                "currency": "usd",
                                "hours": 7
                            },
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 292160,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 71024,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 48426,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 20016,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4681,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 20016,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4681,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "5460d1b3-a0dd-47da-9c90-9952a8e005d4",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 228350,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 119997,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 228350,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 50237,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 22835,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 14158,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 3311,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 14158,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 3311,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 13701,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 2284,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 1370,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 457,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 6851,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 2740,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 1827,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 913,
                                "currency": "usd"
                            }
                        ]
                    }
                ]
            }
        },
        {
            "payment_id": "54a43cc9-769f-42e7-b0d7-b84f08f709b3",
            "code": 200,
            "body": {
                "paging": {
                    "count": 14,
                    "offset": 0
                },
                "pay_statements": [
                    {
                        "individual_id": "e241c2d8-bcd5-48ac-a3fa-23f6ac0fd9fb",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 821621,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 267437,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 769063,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Supplemental pay: Commission",
                                "type": "commission",
                                "amount": 52558,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 262919,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 164324,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 50941,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 11914,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 50941,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 11914,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 49297,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 8216,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 4930,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1643,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 24649,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 9859,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 6573,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 3286,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "3c240dce-836a-477a-8329-0d1d3ff25f55",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 72,
                        "gross_pay": {
                            "amount": 185184,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 111760,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 185184,
                                "currency": "usd",
                                "hours": 72
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 40740,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 18518,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 11481,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 2685,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 11481,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 2685,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "ee6d751e-835c-46e6-a157-931872e0efb6",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 78,
                        "gross_pay": {
                            "amount": 284856,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 157669,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 284856,
                                "currency": "usd",
                                "hours": 78
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 62668,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 42728,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 17661,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4130,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 17661,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4130,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "c075169c-d0df-4464-96f6-3ae42e9198ea",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 512747,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 207921,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 483810,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Bonus",
                                "type": "bonus",
                                "amount": 28937,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 123059,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 102549,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 31790,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 7435,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 31790,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 7435,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 30765,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 5127,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 3076,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1025,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 15382,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 6153,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 4102,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 2051,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "79138355-6caa-473e-a501-7f859fdaa1b0",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 675853,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 274057,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 647324,
                                "currency": "usd",
                                "hours": 64
                            },
                            {
                                "name": "Non-qualified sick",
                                "type": "sick",
                                "amount": 28529,
                                "currency": "usd",
                                "hours": 16
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 162205,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 135171,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 41903,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 9800,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 41903,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 9800,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 40551,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 6759,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 4055,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1352,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 20276,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 8110,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 5407,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 2703,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a94cb69d-a4be-468a-a9f6-8f0152cbc318",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 308860,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 162306,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 285169,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "PTO",
                                "type": null,
                                "amount": 23691,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 67949,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 30886,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 19149,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4478,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 19149,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4478,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 18532,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 3089,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 1853,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 618,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 9266,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 3706,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 2471,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 1235,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "83c4cf71-180d-43dc-a63d-3930b44cf9e8",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1253941,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 370541,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1167844,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Mileage & Meals",
                                "type": null,
                                "amount": 86097,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 438879,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 250788,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 77744,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 18182,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 77744,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 18182,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 75236,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 12539,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 7524,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2508,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 37618,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 15047,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 10032,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 5016,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "363d1476-a627-4831-8af3-9ed6bdbe8dff",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 484365,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 196409,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 461571,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Supplemental pay: Commission",
                                "type": "commission",
                                "amount": 22794,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 116248,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 96873,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 30031,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 7023,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 30031,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 7023,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 29062,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 4844,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 2906,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 969,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 14531,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 5812,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 3875,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 1937,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a905b6e7-4b84-4c19-9f27-e25d7227b41a",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 309400,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 162590,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 309400,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 68068,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 30940,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 19183,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 4486,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 19183,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 4486,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 18564,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 3094,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 1856,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 619,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 9282,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 3713,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 2475,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 1238,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "07a005c3-321a-4deb-8099-6edaacdc78d4",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1087904,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 321476,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1067101,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "Supplemental pay: Commission",
                                "type": "commission",
                                "amount": 20803,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 380766,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 217581,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 67450,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 15775,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 67450,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 15775,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 65274,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 10879,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 6527,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2176,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 32637,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 13055,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 8703,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 4352,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "c679f22e-c012-4cb8-924f-5d83b53cdb12",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 69,
                        "gross_pay": {
                            "amount": 248745,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 150117,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "Regular",
                                "type": "1099",
                                "amount": 248745,
                                "currency": "usd",
                                "hours": 69
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 54724,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 24875,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 15422,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 3607,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 15422,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 3607,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [],
                        "employer_contributions": []
                    },
                    {
                        "individual_id": "4b44d236-b896-4021-a185-3ee22a262865",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 923912,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 273016,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 870237,
                                "currency": "usd",
                                "hours": 80
                            },
                            {
                                "name": "PTO",
                                "type": null,
                                "amount": 53675,
                                "currency": "usd",
                                "hours": 0
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 323369,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 184782,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 57283,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 13397,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 57283,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 13397,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 55435,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 9239,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 5543,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 1848,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 27717,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 11087,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 7391,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 3696,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "a34f20d9-ab29-4b6b-97dc-86164c5a7301",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 1263100,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 373246,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 1075120,
                                "currency": "usd",
                                "hours": 72
                            },
                            {
                                "name": "Tips",
                                "type": "tips",
                                "amount": 86626,
                                "currency": "usd",
                                "hours": 0
                            },
                            {
                                "name": "Non-qualified sick",
                                "type": "sick",
                                "amount": 101354,
                                "currency": "usd",
                                "hours": 8
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 442085,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 252620,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 78312,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 18315,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 78312,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 18315,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 75786,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 12631,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 7579,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 2526,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 37893,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 15157,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 10105,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 5052,
                                "currency": "usd"
                            }
                        ]
                    },
                    {
                        "individual_id": "5460d1b3-a0dd-47da-9c90-9952a8e005d4",
                        "type": "regular_payroll",
                        "payment_method": "direct_deposit",
                        "total_hours": 80,
                        "gross_pay": {
                            "amount": 228350,
                            "currency": "usd"
                        },
                        "net_pay": {
                            "amount": 119997,
                            "currency": "usd"
                        },
                        "earnings": [
                            {
                                "name": "REGULAR",
                                "type": "wage",
                                "amount": 228350,
                                "currency": "usd",
                                "hours": 80
                            }
                        ],
                        "taxes": [
                            {
                                "type": "federal",
                                "name": "Federal Income Tax",
                                "employer": false,
                                "amount": 50237,
                                "currency": "usd"
                            },
                            {
                                "type": "state",
                                "name": "State Income Tax",
                                "employer": false,
                                "amount": 22835,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI)",
                                "employer": false,
                                "amount": 14158,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare",
                                "employer": false,
                                "amount": 3311,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Social Security (OASDI) - Employer",
                                "employer": true,
                                "amount": 14158,
                                "currency": "usd"
                            },
                            {
                                "type": "fica",
                                "name": "Medicare - Employer",
                                "employer": true,
                                "amount": 3311,
                                "currency": "usd"
                            }
                        ],
                        "employee_deductions": [
                            {
                                "type": "401k",
                                "name": "401(k) plan %",
                                "amount": 13701,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED PRE TAX",
                                "amount": 2284,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN PRE TAX",
                                "amount": 1370,
                                "currency": "usd",
                                "pre_tax": true
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS PRE TAX",
                                "amount": 457,
                                "currency": "usd",
                                "pre_tax": true
                            }
                        ],
                        "employer_contributions": [
                            {
                                "type": "401k",
                                "name": "401(k) Employer",
                                "amount": 6851,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_medical",
                                "name": "MED Employer",
                                "amount": 2740,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_dental",
                                "name": "DEN Employer",
                                "amount": 1827,
                                "currency": "usd"
                            },
                            {
                                "type": "s125_vision",
                                "name": "VIS Employer",
                                "amount": 913,
                                "currency": "usd"
                            }
                        ]
                    }
                ]
            }
        }
    ]
}
