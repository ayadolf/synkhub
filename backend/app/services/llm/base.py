from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """Interface abstraite pour tous les providers LLM."""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> dict:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
