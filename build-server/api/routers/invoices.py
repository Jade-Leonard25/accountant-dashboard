from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import models, schemas
from api.deps import get_current_context
from services.posting import post_journal_entry, PostingError, q2

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/", response_model=schemas.InvoiceRead)
def create_invoice(payload: schemas.InvoiceCreate, ctx: dict = Depends(get_current_context)):
    db = ctx["db"]
    
    # 1. Calculate Math
    subtotal = Decimal("0.00")
    tax_total = Decimal("0.00")
    prepared_lines = []

    for line in payload.lines:
        line_total = q2(line.quantity * line.unit_price)
        tax_amount = Decimal("0.00")
        
        if line.tax_rate_id:
            tax_rate = db.get(models.TaxRate, line.tax_rate_id)
            if not tax_rate:
                raise HTTPException(400, f"Tax rate {line.tax_rate_id} not found")
            tax_amount = q2(line_total * (tax_rate.rate / Decimal("100")))

        subtotal += line_total
        tax_total += tax_amount
        
        prepared_lines.append({
            **line.model_dump(),
            "line_total": line_total,
            "tax_amount": tax_amount
        })

    total = subtotal + tax_total

    # 2. Handle Due Date (Schema allows None, Model requires it)
    due_date = payload.due_date
    if not due_date:
        # Fetch contact terms if not provided
        contact = db.get(models.Contact, payload.contact_id)
        terms = contact.payment_terms_days if contact else 30
        due_date = payload.issue_date + timedelta(days=terms)

    # 3. Generate Invoice Number
    count = db.query(models.Invoice).filter(models.Invoice.company_id == ctx["company_id"]).count()
    invoice_number = f"INV-{payload.issue_date.year}-{(count + 1):04d}"

    # 4. Create Invoice
    invoice = models.Invoice(
        **payload.model_dump(exclude={"lines", "due_date"}),
        company_id=ctx["company_id"],
        number=invoice_number,
        due_date=due_date,
        subtotal=subtotal,
        tax_total=tax_total,
        total=total,
        status=models.DocStatus.approved,
        created_by=ctx["user_id"],
        last_modified_by=ctx["user_id"]
    )
    
    for line in prepared_lines:
        invoice.lines.append(models.InvoiceLine(**line))

    db.add(invoice)
    db.flush()

    # 5. Post to GL (Balanced with Tax)
    try:
        # These should be fetched dynamically from models.Account by code (e.g., "1100", "4000", "2100")
        ar_account_id = "AR-ACCOUNT-UUID"
        revenue_account_id = "REVENUE-ACCOUNT-UUID"
        tax_payable_account_id = "TAX-ACCOUNT-UUID"
        
        lines = [
            {"account_id": ar_account_id, "debit": total, "credit": 0, "contact_id": invoice.contact_id},
            {"account_id": revenue_account_id, "debit": 0, "credit": subtotal},
        ]
        
        # Only add tax line if there is tax
        if tax_total > 0:
            lines.append({"account_id": tax_payable_account_id, "debit": 0, "credit": tax_total})

        entry = post_journal_entry(
            db,
            company_id=ctx["company_id"],
            entry_date=invoice.issue_date,
            memo=f"Invoice {invoice.number}",
            created_by=ctx["user_id"],
            source_type="invoice",
            source_id=invoice.id,
            lines=lines
        )
        invoice.journal_entry_id = entry.id
        
        db.commit()
        db.refresh(invoice)
        return invoice
        
    except PostingError as e:
        db.rollback()
        raise HTTPException(400, str(e))
