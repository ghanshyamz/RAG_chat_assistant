# RAG Chat Assistant API Documentation

This document outlines the available API endpoints for the RAG Chat Assistant backend. The API is built with FastAPI and runs on `http://localhost:8000` by default.

Interactive API docs are available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Document Management

### 1. Upload a Document
Upload a document (PDF, TXT, MD) to the system. The file will be saved, parsed, chunked, and embedded asynchronously in a background task.

**Endpoint**: `POST /api/documents`
**Content-Type**: `multipart/form-data`

#### Parameters
- `file` (File, required): The file to upload. Supported formats: `.pdf`, `.txt`, `.md`.

#### Example Request
```bash
curl -X POST "http://localhost:8000/api/documents" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

#### Success Response (`200 OK`)
```json
{
  "message": "Document uploaded successfully and is being processed",
  "document_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### Error Responses
| Status | Condition | Example Body |
|--------|-----------|-------------|
| `400` | No filename provided | `{"detail": "No filename provided"}` |
| `500` | File save failure | `{"detail": "Failed to save file: ..."}` |

#### Document Status Lifecycle
After upload, the document transitions through the following statuses as the background ingestion pipeline runs:

| Status | Meaning |
|--------|---------|
| `uploaded` | File saved to disk, metadata created. Background processing has been queued. |
| `processing` | The ingestion pipeline (parse → chunk → embed → index) is actively running. |
| `indexed` | Ingestion completed successfully. The document is searchable via chat. |
| `error` | Ingestion failed. Check server logs for details. |

---

### 2. List All Documents
Retrieve a list of all documents that have been uploaded to the system, along with their metadata and current processing status.

**Endpoint**: `GET /api/documents`

#### Example Request
```bash
curl -X GET "http://localhost:8000/api/documents" \
  -H "accept: application/json"
```

#### Success Response (`200 OK`)
```json
{
  "documents": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "filename": "document.pdf",
      "content_type": "application/pdf",
      "status": "indexed",
      "created_at": "2026-07-18T10:00:00Z"
    }
  ]
}
```

---

### 3. Delete a Document
Hard delete a document from the system. This synchronously removes the document's vectors from the vector store and its metadata/chunks from the relational database.

**Endpoint**: `DELETE /api/documents/{document_id}`

#### Parameters
- `document_id` (Path, required): The UUID of the document to delete.

#### Example Request
```bash
curl -X DELETE "http://localhost:8000/api/documents/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "accept: application/json"
```

#### Success Response (`200 OK`)
```json
{
  "message": "Document a1b2c3d4-e5f6-7890-abcd-ef1234567890 deleted successfully"
}
```

#### Error Responses
| Status | Condition | Example Body |
|--------|-----------|-------------|
| `404` | Document not found | `{"detail": "Document not found or could not be deleted"}` |
| `500` | Vector store deletion failure | `{"detail": "Failed to delete vectors: ..."}` |

---

## Chat

### 4. Stream Chat Response
Send a chat message to the RAG LangGraph orchestration and receive the response as a Server-Sent Events (SSE) stream.

The backend uses LangGraph's `astream` with `stream_mode="updates"`, which emits one SSE event containing the **complete AI response** when the generator node finishes (not token-by-token).

**Endpoint**: `POST /api/chat/stream`
**Content-Type**: `application/json`
**Response Content-Type**: `text/event-stream`

#### Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Array\<Message\> | Yes | A list of message objects. |
| `thread_id` | String | No | Conversation thread identifier. If omitted, a new UUID is generated. Pass the same `thread_id` across requests to maintain conversation history. |

**Message Object:**
| Field | Type | Description |
|-------|------|-------------|
| `role` | String | One of `"user"`, `"assistant"`, or `"system"`. |
| `content` | String | The text content of the message. |

#### Example Request
```bash
curl -X POST "http://localhost:8000/api/chat/stream" \
  -H "accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is the main topic of the uploaded document?"
      }
    ],
    "thread_id": "session-123"
  }'
```

#### Example Response (SSE format)
The response is a `text/event-stream`. Each event is prefixed with `data: ` and separated by a blank line.

```text
data: {"content": "The main topic of the document is the new modular architecture for the RAG system."}

data: [DONE]
```

> **Note:** The response arrives as a **single content event** containing the full AI answer, followed by a `[DONE]` sentinel. This is because the LangGraph graph streams node-level updates, not individual tokens.

#### Error Responses
| Status | Condition | Example Body |
|--------|-----------|-------------|
| `400` | Empty messages array | `{"detail": "Messages array cannot be empty"}` |

If an error occurs **during streaming** (after the SSE connection is open), it is delivered as an SSE event:
```text
data: {"error": "An internal error occurred while generating the response."}
```

---

## Notes

- **Conversation Memory**: The `/api/chat/stream` endpoint uses an in-memory LangGraph checkpointer. Passing a consistent `thread_id` across requests maintains conversation context automatically. The `messages` array in each request provides the new input for that turn.
- **Background Processing**: Document ingestion (parse → chunk → embed → index) runs as a FastAPI `BackgroundTask`. The upload endpoint returns immediately while processing continues server-side. Poll `GET /api/documents` to check the document's `status` field.
- **CORS**: The API allows all origins (`*`) for local development. This should be restricted in production.
