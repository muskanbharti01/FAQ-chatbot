import os
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List

from nlp_engine import FAQMatcher

# Setup paths relative to main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAQS_PATH = os.path.join(BASE_DIR, "faqs.json")

# Initialize FAQ Matcher
matcher = FAQMatcher(FAQS_PATH)

app = FastAPI(
    title="FAQ Chatbot API",
    description="NLP-powered similarity matching FAQ chatbot and CRUD manager API.",
    version="1.0.0"
)

# API Request/Response Schemas
class ChatRequest(BaseModel):
    message: str
    threshold: Optional[float] = 0.2

class FAQSchema(BaseModel):
    id: int
    question: str
    answer: str
    category: str

class FAQCreateUpdateSchema(BaseModel):
    question: str
    answer: str
    category: str

# Endpoints
@app.post("/api/chat")
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty")
    
    match_result = matcher.match(request.message, threshold=request.threshold)
    return match_result

@app.get("/api/faqs", response_model=List[FAQSchema])
def get_faqs():
    return matcher.faqs

@app.post("/api/faqs", response_model=FAQSchema, status_code=status.HTTP_201_CREATED)
def create_faq(faq_data: FAQCreateUpdateSchema):
    if not faq_data.question.strip() or not faq_data.answer.strip() or not faq_data.category.strip():
        raise HTTPException(status_code=400, detail="Question, answer, and category are required")
    
    new_faq = matcher.add_faq(faq_data.question, faq_data.answer, faq_data.category)
    return new_faq

@app.put("/api/faqs/{faq_id}", response_model=FAQSchema)
def update_faq(faq_id: int, faq_data: FAQCreateUpdateSchema):
    if not faq_data.question.strip() or not faq_data.answer.strip() or not faq_data.category.strip():
        raise HTTPException(status_code=400, detail="Question, answer, and category are required")
    
    updated_faq = matcher.update_faq(faq_id, faq_data.question, faq_data.answer, faq_data.category)
    if not updated_faq:
        raise HTTPException(status_code=404, detail=f"FAQ with ID {faq_id} not found")
    return updated_faq

@app.delete("/api/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(faq_id: int):
    success = matcher.delete_faq(faq_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"FAQ with ID {faq_id} not found")
    return None

# Frontend Routes (Flat serving)
@app.get("/")
def read_index():
    index_path = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to FAQ Chatbot API. index.html is missing!"}

@app.get("/static/style.css")
def read_style():
    style_path = os.path.join(BASE_DIR, "style.css")
    if os.path.exists(style_path):
        return FileResponse(style_path)
    raise HTTPException(status_code=404, detail="style.css not found")

@app.get("/static/app.js")
def read_js():
    js_path = os.path.join(BASE_DIR, "app.js")
    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="app.js not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
