from fastapi import APIRouter, UploadFile, File, Form
import httpx
import os
import shutil
import uuid
import subprocess
import asyncio
import json
import re

from vision.vision_client import VisionClient
from audio.assemblyai_client import AssemblyAIClient
from models import get_llm_client

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


# ✅ Video transcription and summarization
@router.post("/extract-from-video-summarize")
async def extract_and_summarize_from_video(video_url: str = Form(...)):
    """Download, transcribe, and summarize a YouTube video."""
    try:
        print(f"Processing video URL: {video_url}")
        
        # Normalize YouTube URL
        if "youtu.be" in video_url:
            print("Detected shortened YouTube URL")
            video_id = video_url.split("/")[-1].split("?")[0]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"Normalized URL to: {video_url}")
            
        temp_dir = "temp_audio"
        os.makedirs(temp_dir, exist_ok=True)
        audio_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.mp3")

        # Get video metadata first
        print("Fetching video metadata...")
        metadata = {}
        try:
            metadata_result = subprocess.run([
                "yt-dlp",
                "--skip-download",
                "--print", "%(title)s",
                "--print", "%(duration)s",
                "--print", "%(id)s",
                video_url
            ], capture_output=True, text=True, check=True)
            
            lines = metadata_result.stdout.strip().split('\n')
            if len(lines) >= 3:
                metadata["title"] = lines[0]
                metadata["duration"] = lines[1]
                metadata["id"] = lines[2]
                print(f"Video metadata: {metadata}")
        except Exception as e:
            print(f"Error fetching metadata: {str(e)}")
            # Continue even if metadata fetching fails

        print("Downloading video audio...")
        result = subprocess.run([
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "-o", audio_path,
            video_url
        ], capture_output=True, text=True, check=True)
        print(f"Download output: {result.stdout}")

        print(f"Reading audio file from: {audio_path}")
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        
        print("Uploading audio to AssemblyAI...")
        transcript_id = None
        
        # Using a separate try/except block for API calls
        try:
            # Use a higher timeout for large audio files
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Upload audio file
                upload_response = await client.post(
                    upload_url, 
                    content=audio_bytes, 
                    headers=headers
                )
                upload_response.raise_for_status()
                audio_url = upload_response.json()["upload_url"]
                print(f"Uploaded audio. URL: {audio_url}")

                # Request transcription
                print("Requesting transcription...")
                transcribe_response = await client.post(
                    "https://api.assemblyai.com/v2/transcript",
                    headers=headers,
                    json={"audio_url": audio_url, "auto_chapters": True}
                )
                transcribe_response.raise_for_status()
                transcript_id = transcribe_response.json()["id"]
                print(f"Transcription requested. ID: {transcript_id}")

                # Poll for transcription status
                status_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
                while True:
                    print("Polling for transcription status...")
                    poll = await client.get(status_url, headers=headers)
                    poll.raise_for_status()
                    data = poll.json()
                    print(f"Transcription status: {data['status']}")
                    
                    if data["status"] == "completed":
                        # Clean up the audio file
                        try:
                            os.remove(audio_path)
                            print(f"Deleted audio file: {audio_path}")
                        except Exception as e:
                            print(f"Warning: Could not delete audio file: {str(e)}")
                            
                        transcript = data["text"]
                        if not transcript or not transcript.strip():
                            print("Error: Empty transcript returned")
                            return {"error": "No transcript found for this video."}
                        
                        # Summarize using OpenAI LLM
                        print("Generating summary with OpenAI...")
                        llm_client = get_llm_client("openai")
                        summary_prompt = f"Summarize the following YouTube transcript in concise bullet points:\n\n{transcript}\n\nSummary:"
                        summary = llm_client.call(summary_prompt)
                        print(f"Summary generated. Length: {len(summary)}")
                        
                        # Format duration if available
                        duration_str = ""
                        if "duration" in metadata and metadata["duration"].isdigit():
                            duration_secs = int(metadata["duration"])
                            minutes = duration_secs // 60
                            seconds = duration_secs % 60
                            duration_str = f"{minutes}:{seconds:02d}"
                        
                        return {
                            "summary": summary, 
                            "transcript": transcript,
                            "title": metadata.get("title", ""),
                            "duration": duration_str
                        }
                    elif data["status"] == "error":
                        print(f"Transcription error: {data.get('error', 'Unknown error')}")
                        return {"error": data.get("error", "Unknown transcription error")}
                    
                    # Add a short delay before the next poll
                    await asyncio.sleep(3)
        except httpx.ReadTimeout:
            # Specific handling for timeout errors
            print("Timeout error during API call to AssemblyAI")
            # Clean up any temporary files
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except:
                pass
            return {"error": "Connection timed out when processing the video. Please try again with a shorter video."}
        except Exception as e:
            print(f"API call error: {str(e)}")
            # Clean up any temporary files
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except:
                pass
            return {"error": f"Error processing video: {str(e)}"}
            
    except Exception as e:
        print(f"Error in extract_and_summarize_from_video: {str(e)}")
        import traceback
        print(traceback.format_exc())
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
