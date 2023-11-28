export default function convertPayStatementToFile(file: CSVRow[]): string {
    const headers = [
        "Finch Individual ID",
        "Social Security Number",
        "First Name",
        "Middle Initial",
        "Last Name",
        "Birth Date",
        "Hire Date",
        "Termination Date",
        "Rehire Date",
        "Compensation Amount", // gross wages?
        "Current Hours of Service", // total hours?
        "Street Address 1",
        "Street Address 2",
        "City",
        "State",
        "Zip Code",
        "E-mail Address - Office",
        "E-mail Address - Home",
        "Plan ID", // stored in customer table in db
        "Pay Period Begin Date", // pay_period.start_date
        "Pay Period End Date", // pay_period.end_date
        "Pay Frequency Code", // ???
        "401(k) Amount",
        "Match Amount",
        "Roth 401(k) Amount",
        "Safe Harbor Match Amount",
        "Profit Sharing Amount",
        "Safe Harbor Non Elective Amount",
        "Loan Payment Amount",
        "Check Date", // payment pay date
        "Divison Code", // department?
        "Personal Phone Number",

        "YTD Compensation Amount",
        "YTD Current Hours of Service",
        "YTD 401(k) Amount",
        "YTD Match Amount",
        "YTD Roth 401(k) Amount",
        "YTD Safe Harbor Match Amount",
        "YTD Profit Sharing Amount",
        "YTD Safe Harbor Non Elective Amount",


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

    // TODO: push data to rows

    // Convert array to csv comma delimited string
    let csvString = rows.map(row => row.join(',')).join('\n')

    return csvString

}
