"""Optional HTTP wrapper around MENTRA's stdin-compatible NLP matcher."""
from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ai.matcher import recommend

app = FastAPI(title="MENTRA recommendation service", version="1.0.0")


class MatchRequest(BaseModel):
    mentee: dict
    mentors: list[dict]


@app.post("/match")
def match_profiles(payload: MatchRequest):
    return {"matches": recommend(payload.mentee, payload.mentors)}


@app.get("/health")
def health():
    return {"status": "ok"}
