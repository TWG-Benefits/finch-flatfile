import { calcIndividualYtdByField, sumAmountsForType } from "./util"

export default function processPayments(plan_id: number, finch: FinchRequiredData): CSVRow[] {
    console.log(`Processing payments`)
    var test: CSVRow[] = []

    finch.payStatements.forEach(payStatement => {
        const payment = finch.payments.find(payment => payment.id == payStatement.payment_id)
        if (!payment)
            return

        const payDate = payment?.pay_date
        const payPeriodStartDate = payment.pay_period?.start_date
        const payPeriodEndDate = payment.pay_period?.end_date
        const payFrequencyCode = "semi_monthly" // ???

        payStatement.body.pay_statements.forEach(paycheck => {
            const individual = finch.individuals.find(ind => ind.individual_id == paycheck.individual_id)
            const employment = finch.employments.find(emp => emp.individual_id == paycheck.individual_id)

            test.push({
                plan_id: plan_id,
                finch_individual_id: paycheck.individual_id,
                social_security_number: individual?.body?.ssn,
                first_name: individual?.body?.first_name,
                middle_name: individual?.body?.middle_name,
                last_name: individual?.body?.last_name,
                birth_date: individual?.body?.dob,
                hire_date: employment?.body?.start_date,
                termination_date: employment?.body?.end_date,
                rehire_date: null,
                department_name: employment?.body?.department?.name,
                address_line1: individual?.body.residence?.line1,
                address_line2: individual?.body.residence?.line2,
                address_city: individual?.body.residence?.city,
                address_state: individual?.body.residence?.state,
                address_zip_code: individual?.body.residence?.postal_code,
                email_address_personal: individual?.body?.emails?.filter(email => email.type === 'personal').map(email => email.data).join('; '),
                email_address_work: individual?.body?.emails?.filter(email => email.type === 'work').map(email => email.data).join('; '),
                phone_number_personal: individual?.body?.phone_numbers?.filter(phone => phone.type === 'personal').map(phone => phone.data).join('; '),

                payroll_type: paycheck?.type,
                gross_wages_amount: paycheck.gross_pay.amount,
                total_hours: paycheck?.total_hours,
                debit_date: payDate,
                pay_period_start_date: payPeriodStartDate,
                pay_period_end_date: payPeriodEndDate,
                pay_frequency_code: payFrequencyCode,

                deduction_401k_amount: sumAmountsForType(paycheck.employee_deductions, '401k') ?? 0,
                contribution_401k_match_amount: sumAmountsForType(paycheck.employer_contributions, '401k') ?? 0,
                deduction_roth_401k_amount: sumAmountsForType(paycheck.employee_deductions, '401k_roth') ?? 0,
                contribution_safe_harbor_match_amount: sumAmountsForType(paycheck.employer_contributions, '401k_roth') ?? 0,
                profit_sharing_amount: null,
                deduction_safe_harbor_non_elective_amount: null,
                deduction_401k_loan_amount: sumAmountsForType(paycheck.employee_deductions, '401k_loan') ?? 0,

                YTD_compensation_amount: calcIndividualYtdByField(paycheck.individual_id, 'gross_pay', finch.ytdPayStatements),
                YTD_total_hours: calcIndividualYtdByField(paycheck.individual_id, 'total_hours', finch.ytdPayStatements),
                YTD_deduction_401k_amount: calcIndividualYtdByField(paycheck.individual_id, '401k', finch.ytdPayStatements, 'deductions'),
                YTD_contribution_401k_match_amount: calcIndividualYtdByField(paycheck.individual_id, '401k', finch.ytdPayStatements, 'contributions'),
                YTD_deduction_roth_401k_amount: calcIndividualYtdByField(paycheck.individual_id, '401k_roth', finch.ytdPayStatements, 'deductions'),
                YTD_contribution_safe_harbor_match_amount: null,
                YTD_profit_sharing_amount: null,
                YTD_deduction_safe_harbor_non_elective_amount: null,
            })
        })
    })

    return test

}
