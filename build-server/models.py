from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, Integer,
    Numeric, String, Text, UniqueConstraint, Boolean, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db import Base

def new_id() -> str:
    return str(uuid.uuid4())

MONEY = Numeric(18, 2, asdecimal=True)
RATE = Numeric(7, 4, asdecimal=True)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class Role(str, enum.Enum):
    owner = "owner"
    accountant = "accountant"
    bookkeeper = "bookkeeper"
    reviewer = "reviewer"
    client = "client"

class AccountType(str, enum.Enum):
    asset = "asset"
    liability = "liability"
    equity = "equity"
    revenue = "revenue"
    expense = "expense"

class ContactType(str, enum.Enum):
    customer = "customer"
    supplier = "supplier"
    both = "both"

class DocStatus(str, enum.Enum):
    draft = "draft"
    awaiting_approval = "awaiting_approval"
    approved = "approved"
    partially_paid = "partially_paid"
    paid = "paid"
    void = "void"

class JournalStatus(str, enum.Enum):
    draft = "draft"
    posted = "posted"
    void = "void"

class PaymentDirection(str, enum.Enum):
    received = "received"
    paid = "paid"

class Frequency(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"

class BankTxnStatus(str, enum.Enum):
    unmatched = "unmatched"
    matched = "matched"
    reconciled = "reconciled"

class Company(TimestampMixin, Base):
    __tablename__ = "companies"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(200))
    legal_name: Mapped[Optional[str]] = mapped_column(String(200))
    tax_number: Mapped[Optional[str]] = mapped_column(String(50))
    base_currency: Mapped[str] = mapped_column(String(3), default="USD")
    fiscal_year_start_month: Mapped[int] = mapped_column(Integer, default=1)
    books_closed_through: Mapped[Optional[date]] = mapped_column(Date)
    members: Mapped[list[CompanyMember]] = relationship(back_populates="company", cascade="all, delete-orphan")

class CompanyMember(TimestampMixin, Base):
    __tablename__ = "company_members"
    __table_args__ = (UniqueConstraint("company_id", "user_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.bookkeeper)
    company: Mapped[Company] = relationship(back_populates="members")

class Account(TimestampMixin, Base):
    __tablename__ = "accounts"
    __table_args__ = (UniqueConstraint("company_id", "code"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[AccountType] = mapped_column(Enum(AccountType), index=True)
    parent_id: Mapped[Optional[str]] = mapped_column(ForeignKey("accounts.id"))
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    parent: Mapped[Optional[Account]] = relationship(remote_side="Account.id")

class TaxRate(TimestampMixin, Base):
    __tablename__ = "tax_rates"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    rate: Mapped[Decimal] = mapped_column(RATE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class JournalEntry(TimestampMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        Index("ix_journal_company_date", "company_id", "entry_date"),
        CheckConstraint("total_debit = total_credit", name="ck_journal_balanced"),
        CheckConstraint("total_debit >= 0 AND total_credit >= 0", name="ck_journal_non_negative"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date] = mapped_column(Date)
    memo: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[JournalStatus] = mapped_column(Enum(JournalStatus), default=JournalStatus.posted)
    total_debit: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"))
    total_credit: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"))
    source_type: Mapped[str] = mapped_column(String(30), default="manual")
    source_id: Mapped[Optional[str]] = mapped_column(String(36))
    reverses_entry_id: Mapped[Optional[str]] = mapped_column(ForeignKey("journal_entries.id"))
    created_by: Mapped[str] = mapped_column(String(64))
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(64))
    lines: Mapped[list[JournalLine]] = relationship(back_populates="entry", cascade="all, delete-orphan")

class JournalLine(Base):
    __tablename__ = "journal_lines"
    __table_args__ = (
        CheckConstraint("debit >= 0 AND credit >= 0", name="ck_line_non_negative"),
        CheckConstraint("NOT (debit > 0 AND credit > 0)", name="ck_line_one_side"),
        CheckConstraint("(debit > 0) OR (credit > 0)", name="ck_line_non_zero"),
        Index("ix_line_account", "account_id"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    entry_id: Mapped[str] = mapped_column(ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    contact_id: Mapped[Optional[str]] = mapped_column(ForeignKey("contacts.id"))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    debit: Mapped[Decimal] = mapped_column(MONEY, default=0)
    credit: Mapped[Decimal] = mapped_column(MONEY, default=0)
    entry: Mapped[JournalEntry] = relationship(back_populates="lines")

class Contact(TimestampMixin, Base):
    __tablename__ = "contacts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    type: Mapped[ContactType] = mapped_column(Enum(ContactType), default=ContactType.customer)
    email: Mapped[Optional[str]] = mapped_column(String(254))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(Text)
    tax_number: Mapped[Optional[str]] = mapped_column(String(50))
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("company_id", "number"),
        Index("ix_invoice_company_status_due", "company_id", "status", "due_date"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[str] = mapped_column(ForeignKey("contacts.id"), index=True)
    number: Mapped[str] = mapped_column(String(30))
    reference: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[DocStatus] = mapped_column(Enum(DocStatus), default=DocStatus.draft)
    issue_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    subtotal: Mapped[Decimal] = mapped_column(MONEY, default=0)
    tax_total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    amount_paid: Mapped[Decimal] = mapped_column(MONEY, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    journal_entry_id: Mapped[Optional[str]] = mapped_column(ForeignKey("journal_entries.id"))
    recurring_invoice_id: Mapped[Optional[str]] = mapped_column(ForeignKey("recurring_invoices.id"))
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(64))
    lines: Mapped[list[InvoiceLine]] = relationship(back_populates="invoice", cascade="all, delete-orphan")
    reminders: Mapped[list[InvoiceReminder]] = relationship(back_populates="invoice", cascade="all, delete-orphan")

    @property
    def amount_due(self) -> Decimal:
        return self.total - self.amount_paid

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    description: Mapped[str] = mapped_column(String(500))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=1)
    unit_price: Mapped[Decimal] = mapped_column(MONEY)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    tax_rate_id: Mapped[Optional[str]] = mapped_column(ForeignKey("tax_rates.id"))
    tax_amount: Mapped[Decimal] = mapped_column(MONEY, default=0)
    line_total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    invoice: Mapped[Invoice] = relationship(back_populates="lines")

class ReminderRule(TimestampMixin, Base):
    __tablename__ = "reminder_rules"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    days_offset: Mapped[int] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

class InvoiceReminder(Base):
    __tablename__ = "invoice_reminders"
    __table_args__ = (UniqueConstraint("invoice_id", "rule_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    rule_id: Mapped[str] = mapped_column(ForeignKey("reminder_rules.id"))
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    invoice: Mapped[Invoice] = relationship(back_populates="reminders")

class RecurringInvoice(TimestampMixin, Base):
    __tablename__ = "recurring_invoices"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[str] = mapped_column(ForeignKey("contacts.id"))
    frequency: Mapped[Frequency] = mapped_column(Enum(Frequency))
    interval: Mapped[int] = mapped_column(Integer, default=1)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    next_run_date: Mapped[date] = mapped_column(Date, index=True)
    due_days: Mapped[int] = mapped_column(Integer, default=30)
    auto_send: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    lines: Mapped[list[RecurringInvoiceLine]] = relationship(cascade="all, delete-orphan")

class RecurringInvoiceLine(Base):
    __tablename__ = "recurring_invoice_lines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    recurring_invoice_id: Mapped[str] = mapped_column(ForeignKey("recurring_invoices.id", ondelete="CASCADE"), index=True)
    description: Mapped[str] = mapped_column(String(500))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=1)
    unit_price: Mapped[Decimal] = mapped_column(MONEY)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    tax_rate_id: Mapped[Optional[str]] = mapped_column(ForeignKey("tax_rates.id"))

class Bill(TimestampMixin, Base):
    __tablename__ = "bills"
    __table_args__ = (
        UniqueConstraint("company_id", "contact_id", "supplier_ref"),
        Index("ix_bill_company_status_due", "company_id", "status", "due_date"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[str] = mapped_column(ForeignKey("contacts.id"), index=True)
    supplier_ref: Mapped[Optional[str]] = mapped_column(String(60))
    status: Mapped[DocStatus] = mapped_column(Enum(DocStatus), default=DocStatus.draft)
    bill_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    scheduled_payment_date: Mapped[Optional[date]] = mapped_column(Date)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    subtotal: Mapped[Decimal] = mapped_column(MONEY, default=0)
    tax_total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    amount_paid: Mapped[Decimal] = mapped_column(MONEY, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    journal_entry_id: Mapped[Optional[str]] = mapped_column(ForeignKey("journal_entries.id"))
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(64))
    lines: Mapped[list[BillLine]] = relationship(back_populates="bill", cascade="all, delete-orphan")

    @property
    def amount_due(self) -> Decimal:
        return self.total - self.amount_paid

class BillLine(Base):
    __tablename__ = "bill_lines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    bill_id: Mapped[str] = mapped_column(ForeignKey("bills.id", ondelete="CASCADE"), index=True)
    description: Mapped[str] = mapped_column(String(500))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=1)
    unit_price: Mapped[Decimal] = mapped_column(MONEY)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    tax_rate_id: Mapped[Optional[str]] = mapped_column(ForeignKey("tax_rates.id"))
    tax_amount: Mapped[Decimal] = mapped_column(MONEY, default=0)
    line_total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    bill: Mapped[Bill] = relationship(back_populates="lines")

class Expense(TimestampMixin, Base):
    __tablename__ = "expenses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[Optional[str]] = mapped_column(ForeignKey("contacts.id"))
    expense_date: Mapped[date] = mapped_column(Date, index=True)
    description: Mapped[str] = mapped_column(String(500))
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    paid_from_account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    tax_rate_id: Mapped[Optional[str]] = mapped_column(ForeignKey("tax_rates.id"))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY, default=0)
    reference: Mapped[Optional[str]] = mapped_column(String(100))
    created_by: Mapped[str] = mapped_column(String(64))
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(64))
    journal_entry_id: Mapped[Optional[str]] = mapped_column(ForeignKey("journal_entries.id"))

class Attachment(TimestampMixin, Base):
    __tablename__ = "attachments"
    __table_args__ = (
        CheckConstraint("(invoice_id IS NOT NULL) + (bill_id IS NOT NULL) + (expense_id IS NOT NULL) = 1", name="ck_attachment_one_parent"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    invoice_id: Mapped[Optional[str]] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"))
    bill_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bills.id", ondelete="CASCADE"))
    expense_id: Mapped[Optional[str]] = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"))
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    storage_path: Mapped[str] = mapped_column(String(500))
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    uploaded_by: Mapped[str] = mapped_column(String(64))

class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[str] = mapped_column(ForeignKey("contacts.id"))
    direction: Mapped[PaymentDirection] = mapped_column(Enum(PaymentDirection))
    payment_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[Decimal] = mapped_column(MONEY)
    bank_account_id: Mapped[str] = mapped_column(ForeignKey("bank_accounts.id"))
    reference: Mapped[Optional[str]] = mapped_column(String(100))
    journal_entry_id: Mapped[Optional[str]] = mapped_column(ForeignKey("journal_entries.id"))
    allocations: Mapped[list[PaymentAllocation]] = relationship(back_populates="payment", cascade="all, delete-orphan")

class PaymentAllocation(Base):
    __tablename__ = "payment_allocations"
    __table_args__ = (
        CheckConstraint("(invoice_id IS NOT NULL) + (bill_id IS NOT NULL) = 1", name="ck_alloc_one_target"),
        CheckConstraint("amount > 0", name="ck_alloc_positive"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    payment_id: Mapped[str] = mapped_column(ForeignKey("payments.id", ondelete="CASCADE"), index=True)
    invoice_id: Mapped[Optional[str]] = mapped_column(ForeignKey("invoices.id"))
    bill_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bills.id"))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    payment: Mapped[Payment] = relationship(back_populates="allocations")

class BankAccount(TimestampMixin, Base):
    __tablename__ = "bank_accounts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    name: Mapped[str] = mapped_column(String(200))
    bank_name: Mapped[Optional[str]] = mapped_column(String(200))
    account_number_last4: Mapped[Optional[str]] = mapped_column(String(4))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Reconciliation(TimestampMixin, Base):
    __tablename__ = "reconciliations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    bank_account_id: Mapped[str] = mapped_column(ForeignKey("bank_accounts.id"), index=True)
    statement_end_date: Mapped[date] = mapped_column(Date)
    statement_ending_balance: Mapped[Decimal] = mapped_column(MONEY)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_by: Mapped[Optional[str]] = mapped_column(String(64))

class BankTransaction(TimestampMixin, Base):
    __tablename__ = "bank_transactions"
    __table_args__ = (
        UniqueConstraint("bank_account_id", "external_id"),
        UniqueConstraint("payment_id", name="uq_banktxn_payment"),
        UniqueConstraint("expense_id", name="uq_banktxn_expense"),
        CheckConstraint("(payment_id IS NULL) OR (expense_id IS NULL)", name="ck_bank_txn_one_match"),
        Index("ix_bank_txn_status", "bank_account_id", "status", "txn_date"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    bank_account_id: Mapped[str] = mapped_column(ForeignKey("bank_accounts.id"))
    external_id: Mapped[str] = mapped_column(String(100))
    txn_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str] = mapped_column(String(500))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    status: Mapped[BankTxnStatus] = mapped_column(Enum(BankTxnStatus), default=BankTxnStatus.unmatched)
    payment_id: Mapped[Optional[str]] = mapped_column(ForeignKey("payments.id"))
    expense_id: Mapped[Optional[str]] = mapped_column(ForeignKey("expenses.id"))
    reconciliation_id: Mapped[Optional[str]] = mapped_column(ForeignKey("reconciliations.id"))
    import_batch: Mapped[Optional[str]] = mapped_column(String(36))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_company_time", "company_id", "created_at"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    company_id: Mapped[str] = mapped_column(String(36))
    user_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(50))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[Optional[str]] = mapped_column(String(36))
    detail: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
