# RAG Chat Assistant

A RAG system built with a FastAPI backend and a Next.js frontend. The application utilizes LangGraph for stateful agent orchestration under the 'Supervisor Pattern', ChromaDB for vector storage, SQLite for relational metadata tracking, and Google Gemini models for embeddings and text generation.

---

## 1. Architecture

The system is designed as a modular monorepo containing a FastAPI backend and a Next.js (App Router) frontend.

### How the Components Interact

The system is made up of simple, cooperating layers:
*   **User Interface (Frontend):** A web application built with Next.js. This is what the user sees and interacts with. It sends documents to the backend, keeps track of the active chat screen, and displays real-time chat messages from the AI.
*   **Application Server (Backend):** A FastAPI server that handles requests from the web interface. It coordinates the chat conversations and processes document uploads in the background so the user doesn't have to wait.
*   **Storage (Database & Files):**
    *   *Uploaded Files:* Saved directly to a folder on the server.
    *   *Document Database:* An SQLite database that tracks document file details (like name and status) and where chunks are stored.
    *   *Search Index:* A ChromaDB vector database that indexes document contents so they can be searched quickly.
*   **AI Models:** Connects to Google Gemini to convert text into searchable values (embeddings) and generate smart chatbot answers.

### Chat Orchestration Workflow

The chatbot handles messages using a coordinated routing workflow. Instead of a single step, the conversation is managed like a simple team:

1.  **The Supervisor (The Manager):** Every time you send a message, it goes to the Supervisor. The Supervisor reads the conversation history and decides what to do next:
    *   If you asked about your uploaded documents, it sends the request to the **Retriever**.
    *   If it is just casual conversation or we already have the information, it sends the request to the **Generator**.
    *   If the request is fully answered, it finishes the conversation task.
2.  **The Retriever (The Researcher):** This step converts your question into a search query, searches the index database, finds the most relevant paragraphs from your uploaded documents, and puts them into the conversation context. It then passes control to the **Generator**.
3.  **The Generator (The Writer):** This step reads your conversation history and the paragraphs found by the Retriever, then writes a helpful, natural response back to you.
4.  **Memory:** The system remembers your chat history across multiple messages using a unique thread ID so you can have back-and-forth conversations.

### Codebase Organization

*   **[backend](file:///e:/Programming/assignment/RAG_chat_assistant/backend)**: Python FastAPI backend.
    *   **[backend/api](file:///e:/Programming/assignment/RAG_chat_assistant/backend/api)**: Endpoint routers for handling chat streaming (Server-Sent Events) and document management.
    *   **[backend/core](file:///e:/Programming/assignment/RAG_chat_assistant/backend/core)**: Dependency injection setup.
    *   **[backend/domain](file:///e:/Programming/assignment/RAG_chat_assistant/backend/domain)**: Core entity models and abstract protocol interfaces (Ports) ensuring the codebase adheres to SOLID principles.
    *   **[backend/infrastructure](file:///e:/Programming/assignment/RAG_chat_assistant/backend/infrastructure)**: Concrete SQLite and Chroma DB database drivers (Adapters).
    *   **[backend/services](file:///e:/Programming/assignment/RAG_chat_assistant/backend/services)**: Business logic implementation including parsing, chunking, embedding, and ingestion pipeline.
    *   **[backend/graph](file:///e:/Programming/assignment/RAG_chat_assistant/backend/graph)**: LangGraph state definitions, nodes, and supervisor routing logic.
*   **[frontend](file:///e:/Programming/assignment/RAG_chat_assistant/frontend)**: Next.js + Tailwind CSS v4 + TypeScript client.
    *   **[frontend/src/app](file:///e:/Programming/assignment/RAG_chat_assistant/frontend/src/app)**: Pages and layout setup.
    *   **[frontend/src/components](file:///e:/Programming/assignment/RAG_chat_assistant/frontend/src/components)**: Modular UI components nested under `Chat/` (ChatInterface, MessageList, ChatInput) and `Sidebar/` (Sidebar, ConversationHistory, DocumentManager).
    *   **[frontend/src/store](file:///e:/Programming/assignment/RAG_chat_assistant/frontend/src/store)**: Redux store for state synchronization.

---

## 2. Design Decisions

1.  **SOLID Ports & Adapters Design:** All infrastructure components (e.g., VectorStore, RelationalStore, LLMProvider, Chunker) are defined as abstract Protocols/Interfaces in the `domain/` layer. The actual business logic depends *only* on these interfaces. If we decide to swap ChromaDB for Pinecone, or Gemini for OpenAI, we only need to write a new adapter class and modify the dependency injection config in `dependencies.py` without modifying any API or service logic.
2.  **Local Development Storage (ChromaDB + SQLite):** To ensure a zero-setup, zero-cost, and fast local environment, ChromaDB runs as a persistent file client, and SQLite stores relational metadata. This allows developers to run the project entirely offline.
3.  **Google Gemini Models:**
    *   **Embedding Model:** `gemini-embedding-2` for dense semantic search vectors with multimodal embedding support.
    *   **LLM Generator:** `gemini-3.1-flash-lite` for cost-efficient, low-latency, and context-aware responses.
4.  **Asynchronous Document Ingestion:** When files are uploaded, FastAPI stores the file and spawns a `BackgroundTasks` thread. The API returns a status response instantly, while the backend works asynchronously to parse the PDF/Text, split it into chunks, embed the content, and update the SQLite state to `indexed`. The frontend polls for status updates, ensuring a smooth user experience.
5.  **Stable Hash-based IDs for Chunks:** Chunks are split using LangChain's `RecursiveCharacterTextSplitter`. To generate consistent identifiers, the system calculates a SHA-256 hash of the `document_id`, the chunk index, and the chunk content. This hash is used as the primary key for both SQLite and ChromaDB, laying the groundwork for future incremental updates (note: the current system always indexes uploaded files from scratch).

---

## 3. Trade-offs

1.  **Embedding Dimensionality vs. Performance:**
    *   **Trade-off:** `gemini-embedding-2` uses a 768-dimensional vector space (which is the default, though customizable up to 3072).
    *   **Consequence:** Higher embedding dimensionality results in superior semantic search and context retrieval accuracy, but increases memory usage and search latency compared to lower-dimensional models (like 384-dim MiniLM). In a production environment, this increases vector database pricing (Pinecone index sizes) and network footprint.
2.  **FastAPI BackgroundTasks vs. Celery:**
    *   **Trade-off:** Using built-in FastAPI background workers instead of a dedicated message broker.
    *   **Consequence:** It keeps the local environment lightweight with zero setup dependencies (no Redis/RabbitMQ required). However, `BackgroundTasks` executes inside the main web server process, meaning intensive document processing will block FastAPI workers, and tasks are not durable if the server restarts.
3.  **In-Memory Session Persistence:**
    *   **Trade-off:** Relying on LangGraph's in-memory `MemorySaver`.
    *   **Consequence:** This makes setup simple and allows instant state retrieval. However, chat history is lost whenever the backend server restarts. In a production environment, this must be swapped with a persistent checkpointer (e.g., PostgreSQL or Redis).

---

## 4. Setup Instructions

### Prerequisites
*   [Python 3.13+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   [Google Gemini API Key](https://aistudio.google.com/)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (using `uv` or `pip`):
    ```bash
    # use uv :
    uv sync
    ```
3.  Configure your environment variables. Create a `.env` file in the `backend/` directory:
    ```env
    GEMINI_API_KEY=gemini_api_key_here
    ```
4.  Start the FastAPI server:
    ```bash
    uv run uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 5. Limitations

1.  **Session Ephemerality:** Because the LangGraph agent uses `MemorySaver` as its checkpointer, all active chat history and conversation context reside in volatile memory and are cleared when the server is restarted.
2.  **Local Document Storage:** Uploaded files are saved to the local disk of the backend host. This prevents horizontal scaling of the API servers unless a centralized object storage (like AWS S3 or Google Cloud Storage) is introduced.
3.  **Lack of Authentication & Multi-Tenancy:** There is no user authentication, session-level security, or permission handling. All uploaded documents are indexed into a single global vector namespace, making them searchable by any chat session.
4.  **No Conversation Search or Archiving:** Chat history is saved in Redux state and local storage on the client side, but cannot be archived or queried on the backend.

---

## 6. What You Would Improve with Another Day of Work

If granted more development time, the following features would be implemented as priority updates:

1.  **Persistent Conversation History (LangGraph Checkpoint Persistence):**
    *   Implement a database checkpointer (e.g., `PostgresSaver` or an SQLite-backed checkpointer) in LangGraph to ensure multi-turn conversation states survive backend restarts.
2.  **LangSmith Integration for Tracing & Observability:**
    *   Configure LangSmith tracing for the agent system to monitor prompt execution times, track supervisor routing accuracy, identify latency bottlenecks in Retriever/Generator nodes, and log user chat histories for evaluation.
3.  **Production-Ready Vector DB Integration (Pinecone):**
    *   Write a `PineconeVectorStore` adapter. This would support remote index querying and scale the vector search capability to handle millions of document vectors without consuming local server memory.
4. **Langsmith Integration:**
    *   Integrate LangSmith to trace and monitor the RAG agent system for debugging and performance analysis. 
