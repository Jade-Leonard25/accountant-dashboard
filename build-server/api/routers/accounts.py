
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

import models
import schema
from api.deps import get_current_context

router = APIRouter(
    prefix="/accounts",
    tags=["Chart of Accounts"]
)


@router.post(
    "/",
    response_model=schema.AccountRead,
    status_code=status.HTTP_201_CREATED
)
def create_account(
    payload: schema.AccountCreate,
    ctx: dict = Depends(get_current_context)
):
    db = ctx["db"]
    company_id = ctx["company_id"]

    # Check if account code already exists for this company
    existing = db.query(models.Account).filter(
        models.Account.company_id == company_id,
        models.Account.code == payload.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account code already exists"
        )

    # Create account
    account = models.Account(
        company_id=company_id,
        code=payload.code,
        name=payload.name,
        account_type=payload.account_type,
        description=payload.description
    )

    try:
        db.add(account)
        db.commit()
        db.refresh(account)

        return account

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )


@router.get(
    "/",
    response_model=List[schema.AccountRead]
)
def list_accounts(
    ctx: dict = Depends(get_current_context)
):
    db = ctx["db"]
    company_id = ctx["company_id"]

    accounts = db.query(models.Account).filter(
        models.Account.company_id == company_id
    ).order_by(
        models.Account.code.asc()
    ).all()

    return accounts

