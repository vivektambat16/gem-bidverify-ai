"""Pydantic request & response models for GeM Vendor Portal."""
import re
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")


class VendorRegisterModel(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200, description="Official legal name of the entity")
    gstin: str = Field(..., description="15-character Goods and Services Tax Identification Number")
    email: str = Field(..., min_length=5, max_length=150, description="Official correspondence email")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    contact_phone: Optional[str] = Field(None, max_length=20, description="Primary contact phone number")
    business_type: Optional[str] = Field("REGULAR", description="REGULAR, MSME, or STARTUP")
    address: Optional[str] = Field(None, max_length=300, description="Registered corporate address")

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: str) -> str:
        clean = v.strip().upper()
        if not GSTIN_REGEX.match(clean):
            raise ValueError("Invalid GSTIN format. Must be 15 alphanumeric characters (e.g., 27AABCT3421K1Z5).")
        return clean

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if "@" not in clean or "." not in clean:
            raise ValueError("Please provide a valid official email address.")
        return clean


class VendorLoginModel(BaseModel):
    identifier: str = Field(..., description="Registered Email address or GSTIN")
    password: str = Field(..., min_length=1, description="Account password")


class BidSubmissionStatus(BaseModel):
    id: int
    bid_id: str
    tender_id: str
    vendor_name: str
    gstin: str
    submission_date: str
    status: str
    compliance_score: int
    risk_level: str
    documents_count: int
