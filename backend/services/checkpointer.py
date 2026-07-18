from typing import Any, Dict, Optional
from domain.interfaces.checkpointer import Checkpointer
from langgraph.checkpoint.memory import MemorySaver

class InMemoryCheckpointer(Checkpointer):
    """
    In-memory implementation of Checkpointer.
    Wraps LangGraph's MemorySaver.
    """
    def __init__(self):
        self._saver = MemorySaver()

    def get_langgraph_checkpointer(self) -> MemorySaver:
        """
        Returns the underlying LangGraph checkpointer for use in workflow.compile().
        """
        return self._saver

    async def get_state(self, thread_id: str) -> Optional[Dict[str, Any]]:
        # This is for domain-specific state retrieval if needed outside graph execution.
        config = {"configurable": {"thread_id": thread_id}}
        state_tuple = await self._saver.aget_tuple(config)
        if state_tuple:
            return state_tuple.checkpoint.get("channel_values")
        return None

    async def save_state(self, thread_id: str, state: Dict[str, Any]) -> None:
        # Saving state manually is less common since LangGraph handles it during execution,
        # but required by the interface.
        pass
