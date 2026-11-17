"""Pydantic v2 schemas (API request/response shapes) for the accounting app.

Pattern per entity:  XCreate (input)  ->  XRead (output, from_attributes=True)
Totals (subtotal, tax, total, amount_paid) are never accepted from the client;
the server computes them.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from models import (
    AccountType, BankTxnStatus, ContactType, DocStatus, Frequency,
    JournalStatus, PaymentDirection, Role,
)

Money = Annotated[Decimal, Field(max_digits=18, decimal_places=2)]
PositiveMoney = Annotated[Decimal, Field(gt=0, max_digits=18, decimal_places=2)]
Percent = Annotated[Decimal, Field(ge=0, le=100, max_digits=7, decimal_places=4)]
Currency = Annotated[str, Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ================= company & access =================
class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    legal_name: Optional[str] = None
    tax_number: Optional[str] = None
    base_currency: Currency = "USD"
    fiscal_year_start_month: int = Field(1, ge=1, le=12)


class CompanyRead(ORM, CompanyCreate):
    id: str
    books_closed_through: Optional[date] = None


class MemberCreate(BaseModel):
    user_id: str
    role: Role = Role.bookkeeper


class MemberRead(ORM, MemberCreate):
    id: str
    company_id: str


# ================= chart of accounts =================
class AccountCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    type: AccountType
    parent_id: Optional[str] = None
    description: Optional[str] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: Optional[bool] = None
    # code and type are intentionally not editable once transactions exist


class AccountRead(ORM, AccountCreate):
    id: str
    is_system: bool
    is_active: bool


class TaxRateCreate(BaseModel):
    name: str
    rate: Percent


class TaxRateRead(ORM, TaxRateCreate):
    id: str
    is_active: bool


# ================= general ledger =================
class JournalLineCreate(BaseModel):
    account_id: str
    contact_id: Optional[str] = None
    description: Optional[str] = None
    debit: Money = Decimal("0.00")
    credit: Money = Decimal("0.00")

    @model_validator(mode="after")
    def one_side_only(self):
        if self.debit < 0 or self.credit < 0:
            raise ValueError("debit and credit cannot be negative")
        if (self.debit > 0) == (self.credit > 0):
            raise ValueError("a line must have either a debit or a credit, not both or neither")
        return self


class JournalEntryCreate(BaseModel):
    entry_date: date
    memo: Optional[str] = Field(None, max_length=500)
    lines: list[JournalLineCreate] = Field(min_length=2)

    @model_validator(mode="after")
    def must_balance(self):
        debits = sum(l.debit for l in self.lines)
        credits = sum(l.credit for l in self.lines)
        if debits != credits:
            raise ValueError(f"entry does not balance: debits {debits} != credits {credits}")
        return self


class JournalLineRead(ORM, JournalLineCreate):
    id: str


class JournalEntryRead(ORM):
    id: str
    entry_date: date
    memo: Optional[str]
    status: JournalStatus
    source_type: str
    source_id: Optional[str]
    reverses_entry_id: Optional[str]
    created_by: str
    lines: list[JournalLineRead]


class GeneralLedgerRow(BaseModel):
    """One row of the general ledger report for a single account."""
    entry_id: str
    entry_date: date
    memo: Optional[str]
    debit: Money
    credit: Money
    running_balance: Money


# ================= contacts =================
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    type: ContactType = ContactType.customer
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    payment_terms_days: int = Field(30, ge=0, le=365)


class ContactRead(ORM, ContactCreate):
    id: str
    is_active: bool


# ================= shared line shape for invoices / bills =================
class DocLineCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    quantity: Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=4)] = Decimal("1")
    unit_price: Money
    account_id: str                      # revenue (invoice) or expense (bill) account
    tax_rate_id: Optional[str] = None


class DocLineRead(ORM, DocLineCreate):
    id: str
    tax_amount: Money
    line_total: Money


# ================= invoices =================
class InvoiceCreate(BaseModel):
    contact_id: str
    issue_date: date
    due_date: Optional[date] = None      # server defaults to issue_date + contact terms
    reference: Optional[str] = None
    currency: Currency = "USD"
    notes: Optional[str] = None
    lines: list[DocLineCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def due_after_issue(self):
        if self.due_date and self.due_date < self.issue_date:
            raise ValueError("due_date cannot be before issue_date")
        return self


class InvoiceUpdate(BaseModel):
    """Only drafts may be edited. Sent invoices are changed via credit note / void."""
    due_date: Optional[date] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    lines: Optional[list[DocLineCreate]] = None


class InvoiceRead(ORM):
    id: str
    number: str
    contact_id: str
    reference: Optional[str]
    status: DocStatus
    issue_date: date
    due_date: date
    currency: str
    subtotal: Money
    tax_total: Money
    total: Money
    amount_paid: Money
    amount_due: Money
    is_overdue: bool = False             # computed in the service layer
    notes: Optional[str]
    sent_at: Optional[datetime]
    lines: list[DocLineRead]


class InvoiceSummary(ORM):
    """Lightweight row for list screens. Don't send lines in lists."""
    id: str
    number: str
    contact_id: str
    status: DocStatus
    issue_date: date
    due_date: date
    total: Money
    amount_due: Money
    is_overdue: bool = False


class SendInvoiceRequest(BaseModel):
    to_emails: list[EmailStr] = Field(min_length=1)
    subject: Optional[str] = None
    message: Optional[str] = None


class ReminderRuleCreate(BaseModel):
    days_offset: int = Field(ge=-60, le=365)   # negative = before due
    subject: str
    body: str
    is_enabled: bool = True


class ReminderRuleRead(ORM, ReminderRuleCreate):
    id: str


class RecurringInvoiceLineCreate(DocLineCreate):
    pass


class RecurringInvoiceCreate(BaseModel):
    contact_id: str
    frequency: Frequency
    interval: int = Field(1, ge=1, le=12)
    start_date: date
    end_date: Optional[date] = None
    due_days: int = Field(30, ge=0, le=365)
    auto_send: bool = False
    lines: list[RecurringInvoiceLineCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class RecurringInvoiceRead(ORM):
    id: str
    contact_id: str
    frequency: Frequency
    interval: int
    start_date: date
    end_date: Optional[date]
    next_run_date: date
    due_days: int
    auto_send: bool
    is_active: bool
    lines: list[RecurringInvoiceLineCreate]


# ================= bills =================
class BillCreate(BaseModel):
    contact_id: str                       # supplier
    supplier_ref: Optional[str] = None
    bill_date: date
    due_date: date
    scheduled_payment_date: Optional[date] = None
    currency: Currency = "USD"
    notes: Optional[str] = None
    lines: list[DocLineCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def dates_ok(self):
        if self.due_date < self.bill_date:
            raise ValueError("due_date cannot be before bill_date")
        return self


class BillRead(ORM):
    id: str
    contact_id: str
    supplier_ref: Optional[str]
    status: DocStatus
    bill_date: date
    due_date: date
    scheduled_payment_date: Optional[date]
    currency: str
    subtotal: Money
    tax_total: Money
    total: Money
    amount_paid: Money
    amount_due: Money
    is_overdue: bool = False
    notes: Optional[str]
    lines: list[DocLineRead]


class ScheduleBillPayment(BaseModel):
    scheduled_payment_date: date
    bank_account_id: str


# ================= expenses & attachments =================
class ExpenseCreate(BaseModel):
    expense_date: date
    description: str = Field(min_length=1, max_length=500)
    amount: PositiveMoney                  # gross
    account_id: str                        # category (expense account)
    paid_from_account_id: str              # bank / card / cash account
    contact_id: Optional[str] = None
    tax_rate_id: Optional[str] = None
    reference: Optional[str] = None


class ExpenseRead(ORM, ExpenseCreate):
    id: str
    tax_amount: Money
    created_by: str


class AttachmentRead(ORM):
    id: str
    file_name: str
    mime_type: str
    size_bytes: int
    uploaded_by: str
    created_at: datetime
    invoice_id: Optional[str] = None
    bill_id: Optional[str] = None
    expense_id: Optional[str] = None


# ================= payments =================
class AllocationCreate(BaseModel):
    invoice_id: Optional[str] = None
    bill_id: Optional[str] = None
    amount: PositiveMoney

    @model_validator(mode="after")
    def exactly_one_target(self):
        if (self.invoice_id is None) == (self.bill_id is None):
            raise ValueError("allocate to exactly one of invoice_id or bill_id")
        return self


class PaymentCreate(BaseModel):
    contact_id: str
    direction: PaymentDirection
    payment_date: date
    amount: PositiveMoney
    bank_account_id: str
    reference: Optional[str] = None
    allocations: list[AllocationCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def allocations_fit(self):
        allocated = sum(a.amount for a in self.allocations)
        if allocated > self.amount:
            raise ValueError("allocations exceed the payment amount")
        for a in self.allocations:
            if self.direction == PaymentDirection.received and a.bill_id:
                raise ValueError("a received payment can only settle invoices")
            if self.direction == PaymentDirection.paid and a.invoice_id:
                raise ValueError("a paid payment can only settle bills")
        return self


class PaymentRead(ORM):
    id: str
    contact_id: str
    direction: PaymentDirection
    payment_date: date
    amount: Money
    bank_account_id: str
    reference: Optional[str]
    allocations: list[AllocationCreate]


# ================= banking & reconciliation =================
class BankAccountCreate(BaseModel):
    name: str
    bank_name: Optional[str] = None
    account_number_last4: Optional[str] = Field(None, pattern=r"^\d{4}$")
    currency: Currency = "USD"
    opening_balance: Money = Decimal("0.00")


class BankAccountRead(ORM):
    id: str
    account_id: str
    name: str
    bank_name: Optional[str]
    account_number_last4: Optional[str]
    currency: str
    is_active: bool


class BankTransactionImportRow(BaseModel):
    """One row from a CSV/OFX import, already parsed."""
    external_id: Optional[str] = None      # server hashes date+amount+description if absent
    txn_date: date
    description: str
    amount: Money                           # signed: + in, - out


class BankImportRequest(BaseModel):
    rows: list[BankTransactionImportRow] = Field(min_length=1, max_length=5000)


class BankImportResult(BaseModel):
    imported: int
    skipped_duplicates: int


class BankTransactionRead(ORM):
    id: str
    bank_account_id: str
    txn_date: date
    description: str
    amount: Money
    status: BankTxnStatus
    payment_id: Optional[str]
    expense_id: Optional[str]


class MatchRequest(BaseModel):
    payment_id: Optional[str] = None
    expense_id: Optional[str] = None

    @model_validator(mode="after")
    def exactly_one(self):
        if (self.payment_id is None) == (self.expense_id is None):
            raise ValueError("match to exactly one of payment_id or expense_id")
        return self


class MatchSuggestion(BaseModel):
    """Auto-match proposal shown to the accountant for one-click confirm."""
    bank_transaction_id: str
    payment_id: Optional[str] = None
    expense_id: Optional[str] = None
    confidence: Annotated[float, Field(ge=0, le=1)]
    reason: str                              # e.g. "same amount, date within 2 days"


class ReconciliationStart(BaseModel):
    bank_account_id: str
    statement_end_date: date
    statement_ending_balance: Money


class ReconciliationStatus(ORM):
    id: str
    bank_account_id: str
    statement_end_date: date
    statement_ending_balance: Money
    cleared_balance: Money                   # computed from matched transactions
    difference: Money                        # must be 0.00 to complete
    unmatched_count: int
    completed_at: Optional[datetime]


# ================= dashboard (computed, never stored) =================
class BankBalance(BaseModel):
    bank_account_id: str
    name: str
    balance: Money
    unreconciled_count: int


class CashFlowPoint(BaseModel):
    period: str                              # "2026-11"
    money_in: Money
    money_out: Money
    net: Money


class ProfitAndLoss(BaseModel):
    start_date: date
    end_date: date
    revenue: Money
    expenses: Money
    net_profit: Money


class DashboardRead(BaseModel):
    total_bank_balance: Money
    bank_balances: list[BankBalance]
    outstanding_invoices_total: Money
    outstanding_invoices_count: int
    overdue_invoices_total: Money
    bills_to_pay_total: Money
    bills_to_pay_count: int
    overdue_bills_total: Money
    cash_flow: list[CashFlowPoint]
    profit_and_loss: ProfitAndLoss


# ================= reports =================
class TrialBalanceRow(BaseModel):
    account_id: str
    code: str
    name: str
    type: AccountType
    debit: Money
    credit: Money


class TrialBalance(BaseModel):
    as_of: date
    rows: list[TrialBalanceRow]
    total_debit: Money
    total_credit: Money                      # must equal total_debit
