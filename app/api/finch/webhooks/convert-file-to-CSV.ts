export default function convertPayStatementToFile(file: CSVRow[], dataRefreshDate: string): string {
    const headers = [
        "Plan ID", // stored in customer table in db
        "Finch Individual ID",
        "Social Security Number",
        "First Name",
        "Middle Initial",
        "Last Name",
        "Birth Date",
        "Hire Date",
        "Termination Date",
        "Rehire Date",
        "Division Code", // department?
        "Street Address 1",
        "Street Address 2",
        "City",
        "State",
        "Zip Code",
        "E-mail Address - Home",
        "E-mail Address - Office",
        "Personal Phone Number",

        "Payroll Type",
        "Compensation Amount", // gross wages?
        "Current Hours of Service", // total hours?
        "Check Date", // payment pay date
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

        "YTD Compensation Amount",
        "YTD Current Hours of Service",
        "YTD 401(k) Amount",
        "YTD Match Amount",
        "YTD Roth 401(k) Amount",
        "YTD Safe Harbor Match Amount",
        "YTD Profit Sharing Amount",
        "YTD Safe Harbor Non Elective Amount",
    ]

    let rows = []
    rows.push(headers)
    file.forEach(row => {
        rows.push(row)
    })

    // Convert array to csv comma delimited string
    let csvContent = rows.map(row => row.join(',')).join('\n')
    csvContent = `${dataRefreshDate}\n\n${csvContent}`

    return csvContent
}
