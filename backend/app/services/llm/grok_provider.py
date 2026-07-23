import asyncio
import httpx
from app.config import GROK_API_KEY
from app.services.llm.base import LLMProvider


class GrokProvider(LLMProvider):
    """Provider Groq API (compatible OpenAI) avec retry automatique."""

    def __init__(self):
        self.api_key = GROK_API_KEY
        self.model = "llama-3.1-8b-instant"
        self.base_url = "https://api.groq.com/openai/v1"

    @property
    def name(self) -> str:
        return "groq"

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate(self, system_prompt: str, user_prompt: str) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
        }

        max_retries = 3
        for attempt in range(max_retries):
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                if r.status_code == 429:
                    wait = 2 ** attempt * 2
                    await asyncio.sleep(wait)
                    continue
                r.raise_for_status()
                data = r.json()
                text = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                tokens = usage.get("total_tokens", 0)
                return {
                    "text": text,
                    "tokens": tokens,
                    "tokens_per_sec": 0,
                }

        raise Exception("Trop de requetes Groq. Reessayez dans quelques secondes.")
