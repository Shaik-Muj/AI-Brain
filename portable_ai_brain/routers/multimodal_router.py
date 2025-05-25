from fastapi import APIRouter, UploadFile, File, Form
import httpx
import os
import shutil
import uuid
import subprocess

from vision.vision_client import VisionClient
from audio.assemblyai_client import AssemblyAIClient

router = APIRouter()

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
vision_client = VisionClient()
audio_client = AssemblyAIClient(api_key=ASSEMBLYAI_API_KEY)


# ✅ Audio file upload transcription
@router.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    upload_url = "https://api.assemblyai.com/v2/upload"
    headers = {"authorization": ASSEMBLYAI_API_KEY}
    file_bytes = await file.read()

    async with httpx.AsyncClient() as client:
        upload_response = await client.post(upload_url, content=file_bytes, headers=headers)
        upload_response.raise_for_status()
        audio_url = upload_response.json()["upload_url"]

        transcribe_response = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers=headers,
            json={"audio_url": audio_url, "auto_chapters": True}
        )
        transcribe_response.raise_for_status()
        transcript_id = transcribe_response.json()["id"]

        status_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        while True:
            poll = await client.get(status_url, headers=headers)
            poll.raise_for_status()
            data = poll.json()
            if data["status"] == "completed":
                return {"text": data["text"]}
            elif data["status"] == "error":
                return {"error": data["error"]}


# ✅ YouTube video URL transcription
@router.post("/extract-from-video")
async def extract_from_video(video_url: str = Form(...)):
    try:
        temp_dir = "temp_audio"
        os.makedirs(temp_dir, exist_ok=True)
        audio_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.mp3")

        subprocess.run([
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "-o", audio_path,
            video_url
        ], check=True)

        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {"authorization": ASSEMBLYAI_API_KEY}

        async with httpx.AsyncClient() as client:
            upload_response = await client.post(upload_url, content=audio_bytes, headers=headers)
            upload_response.raise_for_status()
            audio_url = upload_response.json()["upload_url"]

            transcribe_response = await client.post(
                "https://api.assemblyai.com/v2/transcript",
                headers=headers,
                json={"audio_url": audio_url, "auto_chapters": True}
            )
            transcribe_response.raise_for_status()
            transcript_id = transcribe_response.json()["id"]

            status_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
            while True:
                poll = await client.get(status_url, headers=headers)
                poll.raise_for_status()
                data = poll.json()
                if data["status"] == "completed":
                    os.remove(audio_path)
                    return {"text": data["text"]}
                elif data["status"] == "error":
                    return {"error": data["error"]}

    except Exception as e:
        return {"error": str(e)}


# ✅ Image upload captioning
@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        temp_dir = "temp_images"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}_{file.filename}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        caption = vision_client.analyze_image(file_path)
        os.remove(file_path)

        return {"caption": caption}

    except Exception as e:
        return {"error": str(e)}
