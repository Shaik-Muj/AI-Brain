from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import prompt_router, multimodal_router, document_router, pdf_router # ✅ Import PDF router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/prompt")
async def handle_prompt(request: Request):
    data = await request.json()
    return await prompt_router.route_prompt(data)

# ✅ Register multimodal endpoints
app.include_router(multimodal_router.router, prefix="/multimodal")

# ✅ Register PDF/document endpoints
app.include_router(document_router.router, prefix="/document")
app.include_router(pdf_router.router, prefix="/pdf")
