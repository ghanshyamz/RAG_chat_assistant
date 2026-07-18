1. Why did you choose this vector database?
a. chromaDB for local and fast developement

b. In production pinecone DB can be used
because it is a fully managed service and scales well.

2. Why this embedding model?
a. gemini-embedding-2, Google's multimodal embedding model
b. Default embedding dimension - 3072 - Highest retrieval quality, more accuracy 
c. gives the flexibility to dynamically scale down the output dimensions to 768 or 1536 to balance search performance with storage costs
d. It accepts text, images, audio, video, and documents, mapping them into a single embedding space - 
better choice if we want multimodalitiy in future


3. Why this chunking strategy?
a. the RecursiveCharacterTextSplitter 
b. preserves paragraphs, then sentences, then words when creating chunks
separates chuncks based on paragraphs if unable to then by sentences if unable to then by words
c. chunk_size: 1000, chunk_overlap: 200, 20% overlap for consistent context



4. Why this prompt?
implemented few shot prompting
few shot prompting is better for complex tasks because it provides examples to the model 

5. How would this scale to 100,000 PDFs?
a. use chunk hashing or metadata fingerprinting to avoid re-ingesting unchanged documents or when a document is updated later with minor changes it should not affect all chunks of that document

b. use a dedicated background task queue to upload the pdf , files, etc. data asynchronously - uploading 100k pdfs can take a lot of time
c. use a distributed vector database like pinecone
d. use production grade database for chat history and other data - postgres

e. current system is modular and adapter based (better for future scalability), which means we can easily use different embedding models, vector databases, and LLMs, persistence DBs like postgres, mongo, redis etc.


6. Biggest limitation of your implementation?
a. local vector database used - ChromaDB
b. RAG agent hallucination - need to implement tracing for debugging
c. no ai chat tracing/ logging implemented - LangSmith
d. no persistence for chat messages - LangGraph in memory storage used



7. Three improvements you would make next.
a. add persistence to chat messages - use sqlite for local, postgres for production, or a nosql db like mongodb
b. add ai chat tracing/ logging - use LangSmith
c. improve prompts for better responses and reduce hallucinations based on the traces and logs
d. implement response streaming - Server-Sent Events (SSE) - not fully implemented currently
