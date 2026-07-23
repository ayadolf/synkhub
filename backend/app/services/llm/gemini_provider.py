import httpx
from app.config import GEMINI_API_KEY
from app.services.llm.base import LLMProvider


class GeminiProvider(LLMProvider):
    """Provider Google Gemini (gratuit, 15 req/min)."""

    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = "gemini-2.0-flash"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate(self, system_prompt: str, user_prompt: str) -> dict:
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048,
            },
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            usage = data.get("usageMetadata", {})
            tokens = usage.get("totalTokenCount", 0)
            return {
                "text": text,
                "tokens": tokens,
                "tokens_per_sec": 0,
            }
