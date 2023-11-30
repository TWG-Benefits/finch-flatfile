export default function convertPayStatementToFile(file: CSVRow[], dataRefreshDate: string): string {
    console.log(`Converting data into CSV file`)
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




    const headersMapping: { [key: string]: string } = {
        plan_id: "Plan ID",
        finch_individual_id: "Finch Individual ID",
        social_security_number: "Social Security Number",
        first_name: "First Name",
        middle_name: "Middle Initial",
        last_name: "Last Name",
        birth_date: "Birth Date",
        hire_date: "Hire Date",
        termination_date: "Termination Date",
        rehire_date: "Rehire Date",
        department_name: "Division Code",
        address_line1: "Street Address 1",
        address_line2: "Street Address 2",
        address_city: "City",
        address_state: "State",
        address_zip_code: "Zip Code",
        email_address_personal: "E-mail Address - Home",
        email_address_work: "E-mail Address - Office",
        phone_number_personal: "Personal Phone Number",
        payroll_type: "Payroll Type",
        gross_wages_amount: "Compensation Amount",
        total_hours: "Current Hours of Service",
        debit_date: "Check Date",
        pay_period_start_date: "Pay Period Begin Date",
        pay_period_end_date: "Pay Period End Date",
        pay_frequency_code: "Pay Frequency Code",
        deduction_401k_amount: "401(k) Amount",
        contribution_401k_match_amount: "Match Amount",
        deduction_roth_401k_amount: "Roth 401(k) Amount",
        contribution_safe_harbor_match_amount: "Safe Harbor Match Amount",
        profit_sharing_amount: "Profit Sharing Amount",
        deduction_safe_harbor_non_elective_amount: "Safe Harbor Non Elective Amount",
        deduction_401k_loan_amount: "Loan Payment Amount",
        YTD_compensation_amount: "YTD Compensation Amount",
        YTD_total_hours: "YTD Current Hours of Service",
        YTD_deduction_401k_amount: "YTD 401(k) Amount",
        YTD_contribution_401k_match_amount: "YTD Match Amount",
        YTD_deduction_roth_401k_amount: "YTD Roth 401(k) Amount",
        YTD_contribution_safe_harbor_match_amount: "YTD Safe Harbor Match Amount",
        YTD_profit_sharing_amount: "YTD Profit Sharing Amount",
        YTD_deduction_safe_harbor_non_elective_amount: "YTD Safe Harbor Non Elective Amount"
    };

    const headersRow = Object.values(headersMapping).join(',')

    // Map each CSVRow in file to a CSV row string
    const valuesRows = file.map(csvRow => {
        return Object.keys(headersMapping)
            .map(key => {
                // Type assertion
                const fileKey = key as keyof CSVRow;
                return csvRow[fileKey] == null ? '' : csvRow[fileKey];
            })
            .join(',');
    });

    // Combine all rows with newline characters
    const csvContent = [headersRow, ...valuesRows].join('\n') + `\n\n${dataRefreshDate}`;

    return csvContent;
}
