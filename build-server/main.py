from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base, SessionLocal
import models
from api.routers import accounts

# Create database tables
Base.metadata.create_all(bind=engine)

server = FastAPI(title="Accounting API")

# Allow Electron to talk to FastAPI
server.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the accounts router we just fixed
server.include_router(accounts.router)

@server.get("/api")
def main_root():
    return {"Message": "Hello World"}

@server.get("/health")
def health():
    return {"status": "ok"}

# Seed the database so you have a company ID to test with
def seed():
    db = SessionLocal()
    if db.query(models.Company).first(): 
        return
    company = models.Company(name="My Business")
    db.add(company)
    db.flush()
    db.add_all([
        models.Account(company_id=company.id, code="1000", name="Cash", type=models.AccountType.asset, is_system=True),
        models.Account(company_id=company.id, code="4000", name="Sales", type=models.AccountType.revenue, is_system=True)
    ])
    db.commit()
    print(f"\n🚀 COMPANY ID: {company.id}\n")

@server.on_event("startup")
def on_startup():
    seed()
