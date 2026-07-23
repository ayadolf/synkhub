from app.services.llm.base import LLMProvider
from app.services.llm.ollama_provider import OllamaProvider
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.grok_provider import GrokProvider
from app.config import LLM_PROVIDER


def get_llm_provider() -> LLMProvider:
    """Retourne le provider LLM configuré ou le premier disponible."""
    providers = {
        "grok": GrokProvider,
        "gemini": GeminiProvider,
        "ollama": OllamaProvider,
    }

    forced = LLM_PROVIDER
    if forced and forced in providers:
        p = providers[forced]()
        if p.is_available():
            return p

    for cls in providers.values():
        p = cls()
        if p.is_available():
            return p

    raise ValueError(
        "Aucun LLM disponible. Configurez GROQ_API_KEY ou GEMINI_API_KEY dans .env "
        "ou installez Ollama avec un modele."
    )
