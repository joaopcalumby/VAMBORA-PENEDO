from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Favoritos
class FavoriteCreate(BaseModel):
    target_type: str  # "line" ou "stop"
    target_id: int

class FavoriteResponse(BaseModel):
    id: int
    target_type: str
    target_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Lembretes
class ReminderCreate(BaseModel):
    line_id: int
    stop_id: int
    anticipation_minutes: int = 10

class ReminderUpdate(BaseModel):
    active: bool

class ReminderResponse(BaseModel):
    id: int
    line_id: int
    stop_id: int
    anticipation_minutes: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Feedback
class FeedbackCreate(BaseModel):
    type: str  # "problem" ou "suggestion"
    message: str
    line_id: Optional[int] = None
    stop_id: Optional[int] = None

class FeedbackResponse(BaseModel):
    id: int
    type: str
    message: str
    line_id: Optional[int]
    stop_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True