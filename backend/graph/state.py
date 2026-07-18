from typing import List
from langgraph.graph import MessagesState

class AgentState(MessagesState):
    next_node: str 
    documents: List[str]
