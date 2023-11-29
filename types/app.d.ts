type FinchRequiredData = {
    individuals: FinchIndividualRes,
    employments: FinchEmploymentRes,
    payments: FinchPayment[],
    payStatements: FinchPayStatement[],
    ytdPayStatements: FinchPayStatement[]
}
type FinchResponseData = {
    individuals: FinchIndividualRes | null | undefined,
    employments: FinchEmploymentRes | null | undefined,
    payments: FinchPayment[] | null | undefined,
    payStatements: FinchPayStatement[] | null | undefined,
    ytdPayStatements: FinchPayStatement[] | null | undefined
}

type CSVRow = {
    plan_id: number; // stored in customer table in db
    finch_individual_id: string;
    social_security_number: string | undefined | null;
    first_name: string | undefined | null;
    middle_name: string | undefined | null;
    last_name: string | undefined | null;
    birth_date: string | undefined | null; //YYYY-MM-DD
    hire_date: string | undefined | null; //YYYY-MM-DD
    termination_date: string | undefined | null; //YYYY-MM-DD
    rehire_date: string | undefined | null; //YYYY-MM-DD
    department_name: string | undefined; // ??? division code??
    address_line1: string | undefined | null;
    address_line2: string | undefined | null;
    address_city: string | undefined | null;
    address_state: string | undefined | null;
    address_zip_code: string | undefined | null;
    email_address_work: string | undefined | null;
    email_address_personal: string | undefined | null;
    phone_number_personal: string | undefined | null;

    payroll_type: string | undefined | null;
    gross_wages_amount: number;
    total_hours: number | null; // total hours?
    debit_date: string; //YYYY-MM-DD
    pay_period_start_date: string | null; //YYYY-MM-DD
    pay_period_end_date: string | null; //YYYY-MM-DD
    pay_frequency_code: string | null; // ??? what formats for code???
    deduction_401k_amount: number;
    contribution_401k_match_amount: number;
    deduction_roth_401k_amount: number;
    contribution_safe_harbor_match_amount: number | null; // ??? is this 401k_roth contribution amount
    profit_sharing_amount: number | null; // ???
    deduction_safe_harbor_non_elective_amount: number | null; // ???
    deduction_401k_loan_amount: number;
    YTD_compensation_amount: number;
    YTD_total_hours: number;
    YTD_deduction_401k_amount: number;
    YTD_contribution_401k_match_amount: number;
    YTD_deduction_roth_401k_amount: number;
    YTD_contribution_safe_harbor_match_amount: number | null; // ???
    YTD_profit_sharing_amount: number | null; // ???
    YTD_deduction_safe_harbor_non_elective_amount: number | null; // ???
}
