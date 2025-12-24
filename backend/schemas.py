from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    company: str
    status: str

class Job(JobCreate):
    id: int

    class Config:
        from_attributes = True
