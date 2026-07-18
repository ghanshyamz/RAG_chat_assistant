import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.dependencies import get_graph_workflow

router = APIRouter(prefix="/api/chat", tags=["chat"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    thread_id: Optional[str] = None

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    workflow = Depends(get_graph_workflow)
):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty")

    # Extract the latest user message
    # In a full OpenAI compatible format, we'd process all messages,
    # but LangGraph manages state via thread_id and Checkpointer.
    # We pass the new messages to the graph.
    
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    # Format messages for Langchain/LangGraph
    formatted_messages = []
    for msg in request.messages:
        if msg.role == "user":
            formatted_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            formatted_messages.append(AIMessage(content=msg.content))
        else:
            formatted_messages.append(SystemMessage(content=msg.content))

    import uuid
    # Configure graph execution
    thread_id = request.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    async def event_generator():
        try:
            # Using astream_events or astream depending on what we want to stream
            # Let's stream the output of the generator node
            async for event in workflow.astream(
                {"messages": formatted_messages},
                config=config,
                stream_mode="updates"
            ):
                # The event dictionary has node names as keys (e.g. 'generator', 'retriever')
                if "generator" in event:
                    # Generator produced a final state update
                    state_update = event["generator"]
                    if "messages" in state_update and state_update["messages"]:
                        # Get the last message which should be the AI response
                        last_message = state_update["messages"][-1]
                        content = last_message.content if hasattr(last_message, "content") else last_message.get("content", "")
                        
                        # Yield in SSE format
                        chunk = json.dumps({"content": content})
                        yield f"data: {chunk}\n\n"
                        
            # Yield end event
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            error_chunk = json.dumps({"error": str(e)})
            yield f"data: {error_chunk}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
