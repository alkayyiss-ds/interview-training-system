from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import PyPDF2
import docx
import io
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Hugging Face API Configuration
HF_API_URL = "https://api-inference.huggingface.co/models/"
HF_TOKEN = os.environ.get('HF_TOKEN', '')  # Optional, for better rate limits

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class CVUpload(BaseModel):
    text: str
    filename: str

class InterviewSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    cv_text: str
    position: str
    questions: List[Dict[str, Any]]
    current_question_index: int = 0
    answers: List[Dict[str, Any]] = []
    score: Optional[float] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StartInterviewRequest(BaseModel):
    cv_text: str
    position: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class InterviewResults(BaseModel):
    session_id: str
    score: float
    total_questions: int
    answers: List[Dict[str, Any]]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        user_doc = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def parse_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")

def parse_docx(file_bytes: bytes) -> str:
    try:
        doc_file = io.BytesIO(file_bytes)
        doc = docx.Document(doc_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing DOCX: {str(e)}")

def generate_questions_with_hf(cv_text: str, position: str, language: str = 'en') -> List[Dict[str, Any]]:
    """Generate interview questions using simple rule-based approach with keyword matching"""
    
    # Fallback questions in both languages
    questions_en = [
        {"question": f"Can you tell me about your experience relevant to the {position} position?", "category": "experience"},
        {"question": f"What skills do you have that make you a good fit for {position}?", "category": "skills"},
        {"question": "Describe a challenging project you worked on and how you handled it.", "category": "problem_solving"},
        {"question": f"Why are you interested in the {position} role?", "category": "motivation"},
        {"question": "What are your greatest strengths and weaknesses?", "category": "self_assessment"},
        {"question": "Where do you see yourself in 5 years?", "category": "career_goals"},
        {"question": "How do you handle pressure and tight deadlines?", "category": "work_style"},
    ]
    
    questions_id = [
        {"question": f"Bisakah Anda ceritakan pengalaman Anda yang relevan dengan posisi {position}?", "category": "experience"},
        {"question": f"Keterampilan apa yang Anda miliki yang membuat Anda cocok untuk {position}?", "category": "skills"},
        {"question": "Ceritakan tentang proyek yang menantang dan bagaimana Anda mengatasinya.", "category": "problem_solving"},
        {"question": f"Mengapa Anda tertarik dengan posisi {position}?", "category": "motivation"},
        {"question": "Apa kekuatan dan kelemahan terbesar Anda?", "category": "self_assessment"},
        {"question": "Di mana Anda melihat diri Anda dalam 5 tahun?", "category": "career_goals"},
        {"question": "Bagaimana Anda menangani tekanan dan deadline yang ketat?", "category": "work_style"},
    ]
    
    return questions_id if language == 'id' else questions_en

def evaluate_answer_with_similarity(question: str, answer: str, expected_keywords: List[str]) -> float:
    """Evaluate answer using cosine similarity and keyword matching"""
    if not answer or len(answer.strip()) < 10:
        return 0.0
    
    # Basic length scoring
    length_score = min(len(answer.split()) / 50, 1.0) * 30
    
    # Keyword scoring
    answer_lower = answer.lower()
    keyword_score = sum(1 for keyword in expected_keywords if keyword.lower() in answer_lower)
    keyword_score = min(keyword_score / max(len(expected_keywords), 1), 1.0) * 40
    
    # Completeness score (simple heuristic)
    completeness_score = 30 if len(answer.split()) >= 20 else 15
    
    total_score = length_score + keyword_score + completeness_score
    return min(total_score, 100.0)

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({'email': user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user.id)
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({'email': credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password')
    user_doc.pop('_id')
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    token = create_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# CV Upload Route
@api_router.post("/interview/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_bytes = await file.read()
    
    if file.filename.endswith('.pdf'):
        text = parse_pdf(file_bytes)
    elif file.filename.endswith('.docx'):
        text = parse_docx(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="CV content is too short or empty")
    
    return {
        "success": True,
        "text": text,
        "filename": file.filename
    }

# Interview Routes
@api_router.post("/interview/start")
async def start_interview(
    request: StartInterviewRequest,
    language: str = 'en',
    current_user: User = Depends(get_current_user)
):
    # Generate questions
    questions = generate_questions_with_hf(request.cv_text, request.position, language)
    
    # Create session
    session = InterviewSession(
        user_id=current_user.id,
        cv_text=request.cv_text,
        position=request.position,
        questions=questions
    )
    
    session_doc = session.model_dump()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    
    await db.interview_sessions.insert_one(session_doc)
    
    return {
        "session_id": session.id,
        "first_question": questions[0] if questions else None,
        "total_questions": len(questions)
    }

@api_router.post("/interview/answer")
async def submit_answer(
    request: AnswerRequest,
    current_user: User = Depends(get_current_user)
):
    # Get session
    session_doc = await db.interview_sessions.find_one({'id': request.session_id, 'user_id': current_user.id}, {'_id': 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if isinstance(session_doc['created_at'], str):
        session_doc['created_at'] = datetime.fromisoformat(session_doc['created_at'])
    
    session = InterviewSession(**session_doc)
    
    if session.completed:
        raise HTTPException(status_code=400, detail="Interview already completed")
    
    # Get current question
    current_q = session.questions[session.current_question_index]
    
    # Evaluate answer
    keywords = [session.position, "experience", "skills", "project", "team"]
    score = evaluate_answer_with_similarity(current_q['question'], request.answer, keywords)
    
    # Store answer
    answer_data = {
        "question": current_q['question'],
        "category": current_q['category'],
        "answer": request.answer,
        "score": score
    }
    session.answers.append(answer_data)
    
    # Move to next question
    session.current_question_index += 1
    
    # Check if interview is complete
    next_question = None
    if session.current_question_index >= len(session.questions):
        session.completed = True
        # Calculate overall score
        total_score = sum(a['score'] for a in session.answers) / len(session.answers)
        session.score = total_score
    else:
        next_question = session.questions[session.current_question_index]
    
    # Update session
    update_doc = session.model_dump()
    update_doc['created_at'] = update_doc['created_at'].isoformat()
    await db.interview_sessions.update_one(
        {'id': request.session_id},
        {'$set': update_doc}
    )
    
    return {
        "answer_score": score,
        "next_question": next_question,
        "completed": session.completed,
        "current_index": session.current_question_index,
        "total_questions": len(session.questions)
    }

@api_router.get("/interview/results/{session_id}")
async def get_results(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    session_doc = await db.interview_sessions.find_one({'id': session_id, 'user_id': current_user.id}, {'_id': 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session_doc['completed']:
        raise HTTPException(status_code=400, detail="Interview not completed yet")
    
    # Analyze results
    answers = session_doc['answers']
    avg_score = session_doc['score']
    
    # Identify strengths and weaknesses
    strengths = []
    weaknesses = []
    
    for answer in answers:
        if answer['score'] >= 70:
            strengths.append(f"{answer['category'].replace('_', ' ').title()}: Strong response")
        elif answer['score'] < 50:
            weaknesses.append(f"{answer['category'].replace('_', ' ').title()}: Needs improvement")
    
    if not strengths:
        strengths = ["Completed all questions", "Showed engagement"]
    if not weaknesses:
        weaknesses = ["Continue practicing communication skills"]
    
    # Generate job recommendations
    recommendations = generate_job_recommendations(session_doc['position'], avg_score, session_doc['cv_text'])
    
    return {
        "session_id": session_id,
        "score": avg_score,
        "total_questions": len(answers),
        "answers": answers,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "position": session_doc['position']
    }

def generate_job_recommendations(position: str, score: float, cv_text: str) -> List[str]:
    """Generate job recommendations based on interview performance"""
    recommendations = []
    
    # Extract potential skills from CV
    cv_lower = cv_text.lower()
    
    # Technical roles
    tech_keywords = ['python', 'javascript', 'java', 'software', 'developer', 'engineer', 'programming']
    has_tech = any(keyword in cv_lower for keyword in tech_keywords)
    
    # Management keywords
    mgmt_keywords = ['manager', 'lead', 'team', 'management', 'supervisor']
    has_mgmt = any(keyword in cv_lower for keyword in mgmt_keywords)
    
    # Data keywords
    data_keywords = ['data', 'analytics', 'analysis', 'scientist', 'analyst']
    has_data = any(keyword in cv_lower for keyword in data_keywords)
    
    if score >= 75:
        recommendations.append(f"Senior {position}")
        if has_tech:
            recommendations.extend(["Technical Lead", "Senior Software Engineer"])
        if has_mgmt:
            recommendations.extend(["Team Manager", "Project Manager"])
    elif score >= 60:
        recommendations.append(f"{position}")
        if has_tech:
            recommendations.extend(["Software Developer", "Full Stack Developer"])
        if has_data:
            recommendations.extend(["Data Analyst", "Business Analyst"])
    else:
        recommendations.append(f"Junior {position}")
        if has_tech:
            recommendations.extend(["Junior Developer", "Software Engineer Intern"])
    
    return recommendations[:5]

@api_router.get("/interview/history")
async def get_interview_history(current_user: User = Depends(get_current_user)):
    sessions = await db.interview_sessions.find(
        {'user_id': current_user.id},
        {'_id': 0, 'cv_text': 0, 'answers': 0}
    ).sort('created_at', -1).to_list(50)
    
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
    
    return sessions

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()