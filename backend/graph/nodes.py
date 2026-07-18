import json
from typing import Dict, Any, Callable
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from graph.state import AgentState
from domain.interfaces.vector_store import VectorStore
from domain.interfaces.llm_provider import LLMProvider
from domain.models import Message, Query

def build_supervisor_node(llm_provider: LLMProvider) -> Callable[[AgentState], Dict[str, Any]]:
    system_prompt = """You are a supervisor managing a RAG (Retrieval-Augmented Generation) system.
Your job is to route the conversation to one of the following workers based on the user's latest input:
- 'retriever': If the user is asking a question that requires searching the knowledge base or documents.
- 'generator': If the user is just conversing, or if context has already been retrieved and you need to generate an answer.
- 'FINISH': If the user's request has been completely satisfied and no further action is needed.

Respond strictly in JSON format with a single key "next_node".

Few-shot examples:
User: "Hi there!"
{"next_node": "generator"}

User: "What does the employee handbook say about PTO?"
{"next_node": "retriever"}

User: "Thanks, that helped."
{"next_node": "FINISH"}
"""
    async def supervisor_node(state: AgentState) -> Dict[str, Any]:
        messages = []
        for m in state["messages"]:
            if isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "system"
            messages.append(Message(role=role, content=m.content))
            
        response_text = await llm_provider.generate(messages, system_prompt=system_prompt)
        
        # Parse JSON
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(clean_json)
            next_node = parsed.get("next_node", "FINISH")
        except Exception:
            next_node = "generator" # fallback
            
        print(f"\n[Supervisor] Routed to node: '{next_node}' based on user input.")
        return {"next_node": next_node}
        
    return supervisor_node

def build_retriever_node(vector_store: VectorStore, llm_provider: LLMProvider, embedding_provider) -> Callable[[AgentState], Dict[str, Any]]:
    system_prompt = """You are an expert search query generator.
Your task is to take the user's latest message and conversation context, and generate a concise search query to look up in the vector database.
Output ONLY the search query string, nothing else.

Few-shot examples:
User: "Tell me about the benefits policy."
Query: benefits policy

User: "Who is the CEO?"
Query: CEO name
"""
    async def retriever_node(state: AgentState) -> Dict[str, Any]:
        # Generate search query
        messages = []
        for m in state["messages"]:
            if isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "system"
            messages.append(Message(role=role, content=m.content))
            
        search_query = await llm_provider.generate(messages, system_prompt=system_prompt)
        search_query = search_query.strip(' "\'')
        print(f"\n[Retriever] Generated search query: '{search_query}'")
        
        # Embed the search query and query the vector store
        query_embedding = await embedding_provider.embed_text(search_query)
        chunks = await vector_store.similarity_search(query_embedding, top_k=5)
        
        docs = [chunk.text for chunk in chunks]
        print(f"[Retriever] Found {len(docs)} documents in the vector store.")
        
        # Return the retrieved documents so they are available in the state
        # for the generator node. We overwrite the previous documents to avoid
        # context bloat across multiple turns.
        return {"documents": docs}
        
    return retriever_node

def build_generator_node(llm_provider: LLMProvider) -> Callable[[AgentState], Dict[str, Any]]:
    system_prompt_template = """You are a helpful AI assistant.
Answer the user's question using the provided context. If the answer is not in the context, say you don't know.

Context:
{context}

Few-shot examples:
Context: "The sky is blue because of Rayleigh scattering."
User: "Why is the sky blue?"
Assistant: "The sky is blue due to a phenomenon called Rayleigh scattering."

Context: "Apples are red."
User: "How far is the moon?"
Assistant: "I don't have information about the moon in my context."
"""
    async def generator_node(state: AgentState) -> Dict[str, Any]:
        docs = state.get("documents", [])
        context_str = "\n\n".join(docs)
        
        print(f"\n[Generator] Generating response using {len(docs)} context documents...")
        
        system_prompt = system_prompt_template.format(context=context_str)
        
        messages = []
        for m in state["messages"]:
            if isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "system"
            messages.append(Message(role=role, content=m.content))
            
        response_text = await llm_provider.generate(messages, system_prompt=system_prompt)
        
        return {"messages": [AIMessage(content=response_text)]}
        
    return generator_node
