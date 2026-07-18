import os
import asyncio
from typing import List
from google import genai

from domain.interfaces.embedding_provider import EmbeddingProvider

class GeminiEmbeddingProvider(EmbeddingProvider):
    """
    Implementation of EmbeddingProvider using Google Gemini via google-genai SDK.
    """
    def __init__(self, model: str = "gemini-embedding-2"):
        self.model = model
        # Initialize client. Assumes GEMINI_API_KEY is in environment variables.
        self.client = genai.Client()

    def _embed_single_sync(self, text: str) -> List[float]:
        """Synchronous helper to embed a single text string."""
        response = self.client.models.embed_content(
            model=self.model,
            contents=text
        )
        return response.embeddings[0].values

    async def embed_text(self, text: str) -> List[float]:
        """Generates embeddings for a single text string."""
        return await asyncio.to_thread(self._embed_single_sync, text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of text strings.
        
        Calls embed_content once per text, processing in concurrent batches
        to respect API rate limits while maintaining throughput.
        """
        if not texts:
            return []
            
        all_embeddings: List[List[float]] = []
        batch_size = 64  # Concurrent requests per batch to avoid rate limits
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            # Run all embed calls in this batch concurrently
            tasks = [asyncio.to_thread(self._embed_single_sync, text) for text in batch_texts]
            batch_results = await asyncio.gather(*tasks)
            all_embeddings.extend(batch_results)
            
        return all_embeddings
