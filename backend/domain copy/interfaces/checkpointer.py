from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Tuple

class Checkpointer(ABC):
    """
    Abstract interface for state persistence.
    While LangGraph uses BaseCheckpointSaver, this interface abstracts it
    so the domain logic doesn't strictly depend on LangGraph internals.
    """
    @abstractmethod
    async def get_state(self, thread_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save_state(self, thread_id: str, state: Dict[str, Any]) -> None:
        pass
