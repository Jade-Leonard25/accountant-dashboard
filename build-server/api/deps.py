from typing import Optional, Any
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from db import get_db
import models

def get_current_context(
    x_company_id: str = Header(..., description="Multi-tenant company ID"),
    x_user_id: str = Header(..., description="better-auth user ID"),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Mock auth dependency. In production, you'd decode a JWT here.
    For now, it expects headers from the Electron renderer.
    """
    # Change "Unknown | None" to "Optional[models.Company]"
    company: Optional[models.Company] = db.get(models.Company, x_company_id)
    
    if not company:
        raise HTTPException(status_code=403, detail="Company not found or access denied")
    
    return {"company_id": x_company_id, "user_id": x_user_id, "db": db}
