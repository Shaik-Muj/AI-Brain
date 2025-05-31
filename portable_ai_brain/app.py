from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import prompt_router, multimodal_router, document_router, search_router
from routers.pdf_router import router as pdf_router  # Fix the router import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/prompt")
async def handle_prompt(request: Request):
    data = await request.json()
    return await prompt_router.route_prompt(data)

# Register routers
app.include_router(multimodal_router.router, prefix="/multimodal")
app.include_router(document_router.router, prefix="/document")
app.include_router(pdf_router, prefix="/pdf")  # Register the router with the correct prefix
app.include_router(search_router.router, prefix="/search")  # ✅ Add search router
