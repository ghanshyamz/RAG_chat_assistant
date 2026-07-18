from typing import List, AsyncGenerator
from domain.interfaces.llm_provider import LLMProvider
from domain.models import Message
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage

class GeminiLLMProvider(LLMProvider):
    def __init__(self, model_name: str = "gemini-3.1-flash-lite"):
        self.llm = ChatGoogleGenerativeAI(model=model_name)

    def _convert_messages(self, messages: List[Message], system_prompt: str) -> List[BaseMessage]:
        langchain_messages: List[BaseMessage] = []
        if system_prompt:
            langchain_messages.append(SystemMessage(content=system_prompt))
            
        for msg in messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == "system":
                langchain_messages.append(SystemMessage(content=msg.content))
        return langchain_messages

    async def generate(self, messages: List[Message], system_prompt: str = "") -> str:
        lc_messages = self._convert_messages(messages, system_prompt)
        response = await self.llm.ainvoke(lc_messages)
        # response.content can be a string or a list of content parts.
        # Handle both cases to extract plain text.
        content = response.content
        if isinstance(content, list):
            # Extract text from content parts like [{'type': 'text', 'text': '...'}]
            parts = []
            for part in content:
                if isinstance(part, dict) and "text" in part:
                    parts.append(part["text"])
                elif isinstance(part, str):
                    parts.append(part)
            return "".join(parts)
        return str(content)

    async def generate_stream(self, messages: List[Message], system_prompt: str = "") -> AsyncGenerator[str, None]:
        lc_messages = self._convert_messages(messages, system_prompt)
        async for chunk in self.llm.astream(lc_messages):
            content = chunk.content
            if content:
                if isinstance(content, list):
                    for part in content:
                        if isinstance(part, dict) and "text" in part:
                            yield part["text"]
                        elif isinstance(part, str):
                            yield part
                else:
                    yield str(content)
