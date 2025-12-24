from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CREATE
@app.post("/jobs", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.Job(
        title=job.title,
        company=job.company,
        status=job.status
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

# READ
@app.get("/jobs", response_model=list[schemas.Job])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

# UPDATE (STATUS)
@app.put("/jobs/{job_id}", response_model=schemas.Job)
def update_job_status(
    job_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = status
    db.commit()
    db.refresh(job)
    return job

# DELETE
@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted"}
