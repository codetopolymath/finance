export interface Loan {
  id: number
  lender: string
  loan_type: string
  agreement_no: string | null
  principal: number
  interest_rate: number
  tenure_months: number
  start_date: string
  emi_amount: number
}

export interface LoanInstallment {
  id: number
  loan_id: number
  installment_num: number
  due_date: string
  amount: number
  principal: number
  interest: number
  closing_principal: number
}

export interface LoanWithInstallments extends Loan {
  installments: LoanInstallment[]
}
