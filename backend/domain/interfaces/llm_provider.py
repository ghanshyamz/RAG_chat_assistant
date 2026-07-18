from abc import ABC, abstractmethod
from typing import List, AsyncGenerator
from domain.models import Message

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: List[Message], system_prompt: str = "") -> str:
        """Generates a full response based on the conversation history."""
        pass

    @abstractmethod
    async def generate_stream(self, messages: List[Message], system_prompt: str = "") -> AsyncGenerator[str, None]:
        """Streams the response based on the conversation history."""
        pass
