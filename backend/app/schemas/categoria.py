from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

CategoryRequestStatus = Literal["pending", "approved", "rejected"]


class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str
    requires_document: bool
    is_default: bool


class CategoryRequestResponse(BaseModel):
    id: int
    category_id: int
    category_slug: str
    category_name: str
    status: CategoryRequestStatus
    document_path: Optional[str]
    justification: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]