import httpx
from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL
from app.services.llm.base import LLMProvider


class OllamaProvider(LLMProvider):
    """Provider Ollama local (gratuit, illimité)."""

    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.model = OLLAMA_MODEL

    @property
    def name(self) -> str:
        return "ollama"

    def is_available(self) -> bool:
        try:
            r = httpx.get(f"{self.base_url}/api/tags", timeout=3)
            return r.status_code == 200
        except Exception:
            return False

    async def generate(self, system_prompt: str, user_prompt: str) -> dict:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "system": system_prompt,
                    "prompt": user_prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 4096},
                },
            )
            r.raise_for_status()
            data = r.json()
            return {
                "text": data["response"],
                "tokens": data.get("eval_count", 0),
                "tokens_per_sec": round(data.get("eval_count", 0) / max(data.get("eval_duration", 1) / 1e9, 0.001), 1),
            }
