from langgraph.graph import StateGraph, START, END
from graph.state import AgentState
from graph.nodes import build_supervisor_node, build_retriever_node, build_generator_node
from domain.interfaces.vector_store import VectorStore
from domain.interfaces.llm_provider import LLMProvider
from services.checkpointer import InMemoryCheckpointer
from functools import lru_cache
from typing import Any

def build_workflow(vector_store: VectorStore, llm_provider: LLMProvider, checkpointer: InMemoryCheckpointer, embedding_provider: Any = None) -> Any:
    """
    Builds and compiles the LangGraph workflow.
    """
    workflow = StateGraph(AgentState)
    
    # 1. Add nodes
    workflow.add_node("supervisor", build_supervisor_node(llm_provider))
    workflow.add_node("retriever", build_retriever_node(vector_store, llm_provider, embedding_provider))
    workflow.add_node("generator", build_generator_node(llm_provider))
    
    # 2. Add edges
    workflow.add_edge(START, "supervisor")
    
    # Conditional routing based on the supervisor's output
    workflow.add_conditional_edges(
        "supervisor",
        lambda state: state.get("next_node", "FINISH"),
        {
            "retriever": "retriever",
            "generator": "generator",
            "FINISH": END
        }
    )
    
    # Retriever passes context directly to the generator
    workflow.add_edge("retriever", "generator")
    # Generator completes the turn and ends the graph execution for this input
    workflow.add_edge("generator", END)
    
    # 3. Compile with memory
    memory = checkpointer.get_langgraph_checkpointer()
    return workflow.compile(checkpointer=memory)

# Optional: You can wrap this in lru_cache in the dependency injection layer
# if you want to ensure the graph is only built once per worker.
