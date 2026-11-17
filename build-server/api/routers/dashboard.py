from fastapi import APIRouter, Depends
from sqlalchemy import func
from decimal import Decimal
from datetime import date
import models, schema
from api.deps import get_current_context

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_model=schemas.DashboardRead)
def get_dashboard(ctx: dict = Depends(get_current_context)):
    db = ctx["db"]
    company_id: str = ctx["company_id"]  # Fixed: str instead of Unknown
    today = date.today()

    # 1. Outstanding Invoices
    out_invs = db.query(models.Invoice).filter(
        models.Invoice.company_id == company_id,
        models.Invoice.status != models.DocStatus.paid
    ).all()
    out_total = sum((i.total - i.amount_paid for i in out_invs), Decimal("0.00"))
    
    # 2. Overdue Invoices
    overdue_invs = [i for i in out_invs if i.due_date < today]
    overdue_total = sum((i.total - i.amount_paid for i in overdue_invs), Decimal("0.00"))

    # 3. Bills to Pay
    bills = db.query(models.Bill).filter(
        models.Bill.company_id == company_id,
        models.Bill.status != models.DocStatus.paid
    ).all()
    bills_total = sum((b.total - b.amount_paid for b in bills), Decimal("0.00"))
    
    # 4. Overdue Bills
    overdue_bills = [b for b in bills if b.due_date < today]
    overdue_bills_total = sum((b.total - b.amount_paid for b in overdue_bills), Decimal("0.00"))

    # 5. Bank Balance
    bank_balance = db.query(func.sum(models.BankTransaction.amount)).filter(
        models.BankTransaction.company_id == company_id,
        models.BankTransaction.status == models.BankTxnStatus.reconciled
    ).scalar() or Decimal("0.00")

    # 6. Profit & Loss (Placeholder for now)
    pl = {
        "start_date": date(today.year, 1, 1),
        "end_date": today,
        "revenue": Decimal("0.00"),
        "expenses": Decimal("0.00"),
        "net_profit": Decimal("0.00")
    }

    return {
        "total_bank_balance": bank_balance,
        "bank_balances": [], 
        "outstanding_invoices_total": out_total,
        "outstanding_invoices_count": len(out_invs),
        "overdue_invoices_total": overdue_total,
        "bills_to_pay_total": bills_total,
        "bills_to_pay_count": len(bills),
        "overdue_bills_total": overdue_bills_total,
        "cash_flow": [], 
        "profit_and_loss": pl
    }
