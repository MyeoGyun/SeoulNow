from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    """Base schema configured for SQLAlchemy ORM compatibility."""

    model_config = ConfigDict(from_attributes=True)
