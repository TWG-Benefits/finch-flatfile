type PayData = {
    payment_id: string,
    pay_date: string | null,
    pay_statements: FinchPayStatement[]
}

// TODO: This ultimately needs to convert each paymentId into separate files, the return string[] of csv files
// right now, it just takes all the pay data and puts it into a single file, but still broken down by pay date
export default function convertPayrollToFile(DirectoryJson: FinchEmployee[], PayDataJson: PayData[], ytdDataJson: PayData[]): string {
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
