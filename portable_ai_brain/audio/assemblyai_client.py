# audio/assemblyai_client.py
import requests

class AssemblyAIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "authorization": self.api_key,
            "content-type": "application/json"
        }
    
    def transcribe_audio_url(self, audio_url: str) -> str:
        transcript_endpoint = "https://api.assemblyai.com/v2/transcript"
        response = requests.post(transcript_endpoint, json={"audio_url": audio_url}, headers=self.headers)
        transcript_id = response.json()["id"]
        
        polling_endpoint = f"{transcript_endpoint}/{transcript_id}"
        while True:
            polling_response = requests.get(polling_endpoint, headers=self.headers)
            status = polling_response.json()["status"]
            if status == "completed":
                return polling_response.json()["text"]
            elif status == "error":
                raise Exception("Transcription failed.")
