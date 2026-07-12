import type { Loan, Recommendation, NegotiationLetter } from "./store";

export type FinancialHealth = {
  totalOutstanding: number;
  totalEmi: number;
  monthlyIncome: number;
  monthlySurplus: number;
  dtiRatio: number;          // outstanding debt / annual income
  emiRatio: number;          // EMI / monthly income
  stressScore: number;       // 0-100, higher = more stress
  healthScore: number;       // 0-100, higher = healthier
  status: "Healthy" | "Watch" | "Stress" | "Critical";
  overdueLoans: number;
};

export function analyze(loans: Loan[]): FinancialHealth {
  const monthlyIncome = loans[0]?.monthlyIncome ?? 0;
  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingAmount, 0);
  const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0);
  const monthlySurplus = Math.max(0, monthlyIncome - totalEmi);
  const dtiRatio = monthlyIncome > 0 ? totalOutstanding / (monthlyIncome * 12) : 0;
  const emiRatio = monthlyIncome > 0 ? totalEmi / monthlyIncome : 0;
  const overdueLoans = loans.filter((l) => l.overdueMonths > 0).length;

  // Stress: weighted blend of EMI burden, DTI, and overdue penalty
  const stressScore = Math.min(
    100,
    Math.round(emiRatio * 55 + Math.min(dtiRatio, 3) * 12 + overdueLoans * 8)
  );
  const healthScore = Math.max(0, 100 - stressScore);

  let status: FinancialHealth["status"] = "Healthy";
  if (stressScore >= 75) status = "Critical";
  else if (stressScore >= 55) status = "Stress";
  else if (stressScore >= 35) status = "Watch";

  return {
    totalOutstanding, totalEmi, monthlyIncome, monthlySurplus,
    dtiRatio, emiRatio, stressScore, healthScore, status, overdueLoans,
  };
}

// Rule-based settlement recommender (mock AI)
export function recommendSettlement(loan: Loan, userId: string): Omit<Recommendation, "id" | "createdAt"> {
  const emiRatio = loan.monthlyIncome > 0 ? loan.emiAmount / loan.monthlyIncome : 1;
  const overdue = loan.overdueMonths;
  const highInterest = loan.interestRate >= 24;

  // Base settlement % offered to lender (of outstanding)
  let pct = 70;
  if (overdue >= 6) pct = 40;
  else if (overdue >= 3) pct = 50;
  else if (overdue >= 1) pct = 60;
  if (highInterest) pct -= 5;
  if (emiRatio > 0.5) pct -= 5;
  pct = Math.max(30, Math.min(85, pct));

  let risk: Recommendation["riskLevel"] = "Low";
  if (overdue >= 6 || emiRatio > 0.6) risk = "Severe";
  else if (overdue >= 3 || emiRatio > 0.45) risk = "High";
  else if (overdue >= 1 || emiRatio > 0.3) risk = "Moderate";

  const offer = Math.round((loan.outstandingAmount * pct) / 100);

  const strategy: string[] = [];
  if (overdue >= 3) strategy.push("Document financial hardship with payslips and bank statements before approaching the lender.");
  if (highInterest) strategy.push("Request waiver of penal interest and late-payment charges as part of the settlement.");
  strategy.push(`Open with a one-time settlement (OTS) offer of ${pct}% of the outstanding (~₹${offer.toLocaleString("en-IN")}).`);
  strategy.push("If the lender refuses OTS, pivot to restructuring: longer tenure with reduced EMI for 12–24 months.");
  strategy.push("Insist on a written 'No Dues / Loan Closed' letter and ensure CIBIL is updated within 30 days of settlement.");

  const analysis =
    `Outstanding ₹${loan.outstandingAmount.toLocaleString("en-IN")} on ${loan.loanType} from ${loan.bankName} ` +
    `at ${loan.interestRate}% interest. EMI consumes ${(emiRatio * 100).toFixed(0)}% of monthly income` +
    `${overdue > 0 ? ` with ${overdue} month(s) overdue` : ""}. ` +
    `Risk level assessed as ${risk}. A settlement at ${pct}% of the outstanding is realistic given the borrower's stress profile.`;

  const recommendation =
    overdue >= 3
      ? `Pursue a one-time settlement at ~${pct}% of outstanding. The lender has commercial incentive to close a defaulted account.`
      : `Negotiate an EMI reduction or interest-rate cut first. Settlement (at ~${pct}%) is a fallback if cashflow worsens.`;

  return {
    userId, loanId: loan.id, recommendation,
    settlementPercentage: pct, riskLevel: risk,
    aiAnalysis: analysis, strategy,
  };
}

// Mock AI letter generator
export function generateLetter(opts: {
  userName: string;
  loan: Loan;
  type: NegotiationLetter["letterType"];
  reason?: string;
  settlementPct?: number;
}): string {
  const { userName, loan, type, reason, settlementPct = 60 } = opts;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const offer = Math.round((loan.outstandingAmount * settlementPct) / 100);
  const hardship =
    reason?.trim() ||
    "a significant reduction in household income combined with rising essential expenses, which has made it impossible to service the current EMI obligations in full.";

  const intro = `Date: ${today}

To,
The Branch Manager
${loan.bankName}

Subject: ${
    type === "settlement"
      ? `Request for One-Time Settlement — ${loan.loanType} Account`
      : type === "emi_reduction"
      ? `Request for EMI Reduction / Loan Restructuring — ${loan.loanType}`
      : `Financial Hardship Notification — ${loan.loanType}`
  }

Respected Sir/Madam,

I, ${userName}, am writing with reference to my ${loan.loanType} availed from ${loan.bankName}, currently carrying an outstanding balance of approximately ₹${loan.outstandingAmount.toLocaleString("en-IN")} and a monthly EMI of ₹${loan.emiAmount.toLocaleString("en-IN")}.`;

  let body = "";
  if (type === "settlement") {
    body = `

Over the last several months I have been facing ${hardship} As a consequence, I have been unable to keep my EMI payments fully current${loan.overdueMonths > 0 ? `, and my account is presently ${loan.overdueMonths} month(s) past due` : ""}. I sincerely regret any inconvenience caused.

After a careful review of my present and projected cashflow, I am in a position to arrange a one-time settlement amount of ₹${offer.toLocaleString("en-IN")} (approximately ${settlementPct}% of the outstanding) by liquidating personal savings and assistance from family. I respectfully request the bank to:

  1. Accept the above as full and final settlement of the account.
  2. Waive accrued penal interest, late-payment charges, and legal recovery costs.
  3. Issue a written "No Dues / Loan Closed" letter on bank letterhead.
  4. Update the credit bureaus (CIBIL/Experian) to reflect the closed status within 30 days.`;
  } else if (type === "emi_reduction") {
    body = `

Due to ${hardship} I am finding it increasingly difficult to meet the current EMI of ₹${loan.emiAmount.toLocaleString("en-IN")}. To avoid default and protect my credit history, I respectfully request the bank to consider restructuring this loan by either:

  1. Reducing the EMI by 30–40% through an extension of the loan tenure, or
  2. Granting a temporary moratorium of 3–6 months with interest capitalisation, or
  3. Reducing the applicable interest rate to bring the EMI within a serviceable range.

I am committed to honouring this obligation in full and am providing this request proactively rather than allowing the account to fall further into arrears.`;
  } else {
    body = `

I wish to formally bring to your attention that I am presently experiencing ${hardship} This has materially impacted my ability to service the EMI on the above-referenced loan${loan.overdueMonths > 0 ? `, which is presently ${loan.overdueMonths} month(s) overdue` : ""}.

I am taking proactive steps to stabilise my finances and would welcome an opportunity to discuss restructuring options, an interest waiver, or a one-time settlement that would allow me to bring this account back to good standing without resorting to litigation or recovery action.`;
  }

  const close = `

I am happy to share supporting documents (salary slips, bank statements, and a written hardship statement) to substantiate this request. Kindly treat this matter with empathy and urgency, and advise me of a convenient time to discuss the proposal in person or over a call.

Thank you for your understanding and continued support.

Sincerely,

${userName}
(Borrower — ${loan.loanType}, ${loan.bankName})`;

  return intro + body + close;
}
