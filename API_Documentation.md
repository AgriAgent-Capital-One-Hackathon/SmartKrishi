# Agricultural Advisor API Documentation

## Overview ✨ ENHANCED

The Agricultural Advisor API is a multi-tenant FastAPI application that provides AI-powered agricultural advice with **advanced document processing**, **code execution**, and **data analysis** capabilities. The API supports chat-based interactions, enhanced file uploads (PDFs, images, DOCX, XLSX), tool integration with code execution, URL context, and streaming responses.

**New Features:**
- 📊 **XLSX Data Analysis**: Upload spreadsheets for automated data analysis and visualization
- 📄 **DOCX Processing**: Word document analysis with comprehensive text and table extraction  
- 💻 **Code Execution**: Dynamic Python code execution for data analysis and chart generation
- 🌐 **URL Context**: Reference external agricultural resources and research papers
- 🔄 **Multiturn Analysis**: Chain analysis steps across conversation turns

**Base URL**: `https://0c05cd19c9d5.ngrok-free.app` (default)

---

## Authentication

Currently, the API uses simple user identification via `user_id` parameters. No authentication tokens are required.

---

## Core Endpoints

### Frontend

#### `GET /`
**Description**: Serve the frontend HTML application  
**Response**: HTML file for the web interface

---

## Chat Management

### `POST /users/{user_id}/chats`
**Description**: Create a new chat for a user

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_name` (form): Name for the new chat

**Response**:
```json
{
  "chat_id": "uuid-string",
  "user_id": "string",
  "chat_name": "string"
}
```

**Example**:
```bash
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/users/alice/chats" \
  -F "chat_name=My Farm Discussion"
```

---

### `GET /users/{user_id}/chats`
**Description**: Get all chats for a user

**Parameters**:
- `user_id` (path): Unique identifier for the user

**Response**:
```json
{
  "user_id": "string",
  "chats": [
    {
      "chat_id": "uuid-string",
      "chat_name": "string",
      "created_at": "timestamp",
      "message_count": 0
    }
  ]
}
```

---

### `GET /users/{user_id}/chats/{chat_id}`
**Description**: Get specific chat details

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_id` (path): Unique identifier for the chat

**Response**:
```json
{
  "user_id": "string",
  "chat_id": "string",
  "chat_name": "string",
  "created_at": "timestamp",
  "message_count": 0
}
```

**Error Responses**:
- `404`: Chat not found

---

### `DELETE /users/{user_id}/chats/{chat_id}`
**Description**: Delete a chat and all its messages

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_id` (path): Unique identifier for the chat

**Response**:
```json
{
  "message": "Chat deleted successfully",
  "chat_id": "string"
}
```

**Error Responses**:
- `404`: Chat not found

---

### `GET /users/{user_id}/chats/{chat_id}/messages`
**Description**: Get messages for a specific chat

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_id` (path): Unique identifier for the chat
- `limit` (query, optional): Maximum number of messages to return (default: 100)

**Response**:
```json
{
  "user_id": "string",
  "chat_id": "string",
  "messages": [
    {
      "id": "uuid-string",
      "role": "user|assistant",
      "msg": "string",
      "timestamp": "ISO-datetime"
    }
  ]
}
```

---

### `POST /users/{user_id}/chats/{chat_id}/messages`
**Description**: Send a message to a specific chat and get streaming response

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_id` (path): Unique identifier for the chat
- `message` (form): The user's message/question
- `model` (form, optional): AI model to use (default: "gemini-2.5-flash")
- `tools` (form, optional): Comma-separated list of tool names to include
- `logs` (form, optional): Whether to include detailed logs (default: false)

**Response**: Streaming JSON with various event types (see Streaming Response section)

---

## AI Query Endpoints

### `POST /ask`
**Description**: Ask a question in a specific chat with optional detailed logging (non-streaming)

**Parameters**:
- `q` (form): The question to ask
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier
- `logs` (form, optional): Include detailed processing logs (default: false)

**Response**:
```json
{
  "answer": "string",
  "approved": true,
  "confidence": 0.95,
  "issues": [],
  "tools": ["tool1", "tool2"],
  "user_id": "string",
  "chat_id": "string",
  "detailed_logs": {...},  // If logs=true
  "grounding": {...}       // If logs=true
}
```

---

### `POST /ask_stream` ✨ ENHANCED
**Description**: Ask a question with streaming response including code execution and URL context

**Parameters**:
- `q` (form): The question to ask
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier
- `include_tools` (form, optional): Comma-separated list of tools to use
- `logs` (form, optional): Include detailed logs (default: false)

**Response**: Server-Sent Events (SSE) stream with JSON objects

**Enhanced Streaming Event Types**:
```json
{"type": "log", "stage": "initialization", "data": {...}}
{"type": "plan", "plan": {...}, "raw_response": "string"}
{"type": "tool_call", "tool": "string", "args": "...", "result": {...}}
{"type": "thinking", "content": "string"}
{"type": "response_chunk", "content": "string"}
{"type": "code_execution", "code": "string", "result": "string", "output": "..."} 
{"type": "url_context", "urls": [...], "content": "string"}
{"type": "grounding_web_search_queries", "queries": [...]}
{"type": "grounding_chunks", "sources": [...]}
{"type": "response", "response": "string", "grounding_metadata": {...}}
{"type": "visualization", "image_data": "base64_string", "description": "string"}
{"type": "end"}
```

**New Capabilities**:
- ✨ **Code Execution**: Automatically executes Python code for data analysis
- ✨ **URL Context**: References external web resources in responses
- ✨ **File Integration**: Automatically includes uploaded file context
- ✨ **Visualizations**: Generates charts and graphs from data analysis
- ✨ **Multiturn Analysis**: Chains analysis steps across conversation

---

## File Management

### `POST /upload/pdf`
**Description**: Upload a PDF file for processing

**Parameters**:
- `file` (multipart): PDF file to upload
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier

**Response**:
```json
{
  "file_id": "uuid-string",
  "stored_path": "string",
  "user_id": "string",
  "chat_id": "string",
  "filename": "string",
  "status": "uploaded",
  "processing_status": "processing|completed|failed",
  "message": "File uploaded successfully. Processing in background..."
}
```

**Error Responses**:
- `500`: Upload failed

---

### `POST /upload/image`
**Description**: Upload an image file for processing

**Parameters**:
- `file` (multipart): Image file to upload (JPG, JPEG, PNG, GIF)
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier

**Response**: Same as PDF upload

---

### `POST /upload/docx` ✨ NEW
**Description**: Upload a DOCX file for advanced document analysis with code execution

**Parameters**:
- `file` (multipart): DOCX file to upload (Word document)
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier

**Response**:
```json
{
  "file_id": "uuid-string",
  "stored_path": "string",
  "user_id": "string",
  "chat_id": "string",
  "filename": "string",
  "status": "uploaded",
  "processing_status": "processing",
  "message": "DOCX file uploaded successfully. Processing with code execution..."
}
```

**Features**:
- Uses Gemini's code execution with python-docx library
- Extracts text, tables, and structured content
- Analyzes document themes and agricultural relevance
- Provides comprehensive document insights

---

### `POST /upload/xlsx` ✨ NEW
**Description**: Upload an XLSX file for data analysis and visualization

**Parameters**:
- `file` (multipart): XLSX file to upload (Excel spreadsheet)
- `user_id` (form, optional): User identifier (auto-generated if not provided)
- `chat_id` (form): Chat identifier

**Response**:
```json
{
  "file_id": "uuid-string",
  "stored_path": "string",
  "user_id": "string",
  "chat_id": "string",
  "filename": "string",
  "status": "uploaded",
  "processing_status": "processing",
  "message": "XLSX file uploaded successfully. Processing with data analysis..."
}
```

**Features**:
- Uses Gemini's code execution with pandas and openpyxl
- Analyzes data structure, patterns, and statistics
- Generates visualizations with matplotlib
- Identifies agricultural data trends and insights
- Creates summary statistics and data profiles

---

### `GET /users/{user_id}/chats/{chat_id}/files`
**Description**: List all files uploaded to a specific chat

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `chat_id` (path): Unique identifier for the chat

**Response**:
```json
{
  "user_id": "string",
  "chat_id": "string",
  "files": [
    {
      "file_id": "uuid-string",
      "original_filename": "string",
      "file_type": "pdf|image|docx|xlsx",
      "processing_status": "processing|completed|failed",
      "upload_time": "ISO-datetime",
      "summary": "string"
    }
  ],
  "total_count": 0
}
```

---

### `GET /users/{user_id}/files`
**Description**: List all files for a user across all chats

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `limit` (query, optional): Maximum number of files to return (default: 50)

**Response**:
```json
{
  "user_id": "string",
  "files": [...],  // Same structure as chat files
  "total_count": 0
}
```

---

### `GET /users/{user_id}/files/{file_id}`
**Description**: Get detailed information about a specific file

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `file_id` (path): Unique identifier for the file

**Response**:
```json
{
  "file_id": "string",
  "user_id": "string",
  "chat_id": "string",
  "original_filename": "string",
  "stored_path": "string",
  "file_type": "pdf|image",
  "file_size": 1024,
  "processing_status": "processing|completed|failed",
  "upload_time": "ISO-datetime",
  "summary": "string",
  "metadata": {...}
}
```

**Error Responses**:
- `404`: File not found

---

### `DELETE /users/{user_id}/files/{file_id}`
**Description**: Delete a file and its metadata

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `file_id` (path): Unique identifier for the file

**Response**:
```json
{
  "message": "File deleted successfully",
  "file_id": "string"
}
```

**Error Responses**:
- `404`: File not found

---

### `GET /users/{user_id}/files/search`
**Description**: Search files by filename or content

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `query` (query): Search query string
- `chat_id` (query, optional): Limit search to specific chat

**Response**:
```json
{
  "user_id": "string",
  "chat_id": "string",
  "query": "string",
  "files": [...],  // Matching files
  "total_matches": 0
}
```

---

## Tool Management

### `GET /tools`
**Description**: List all available tool names

**Response**:
```json
{
  "tools": ["weather_api", "soil_api", "market_api", "chat_history"]
}
```

---

### `GET /users/{user_id}/tools`
**Description**: Get current tool preferences for a user

**Parameters**:
- `user_id` (path): Unique identifier for the user

**Response**:
```json
{
  "user_id": "string",
  "include_tools": ["weather_api", "soil_api"]
}
```

---

### `POST /users/{user_id}/tools`
**Description**: Set tool preferences for a user

**Parameters**:
- `user_id` (path): Unique identifier for the user
- `include_tools` (JSON body): Array of tool names to include

**Request Body**:
```json
["weather_api", "soil_api", "market_api"]
```

**Response**:
```json
{
  "user_id": "string",
  "include_tools": ["weather_api", "soil_api", "market_api"]
}
```

---

## Available Tools

The system includes several built-in tools:

1. **weather_api**: Get weather information for locations
2. **soil_api**: Retrieve soil data and analysis
3. **market_api**: Access agricultural market prices and trends
4. **chat_history**: Search through chat message history

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `404`: Resource not found
- `500`: Internal server error

Error responses follow this format:
```json
{
  "error": "Error description"
}
```

---

## Streaming Response Details

The `/ask_stream` endpoint returns Server-Sent Events with the following event types:

### Log Events
```json
{"type": "log", "stage": "initialization|planner_start|tools_start|agent_start|complete", "message": "string", "data": {...}}
```

### Plan Events
```json
{"type": "plan", "plan": {"primary_intent": "string", "tools_needed": [], "location": "string", "crop": "string"}, "raw_response": "string"}
```

### Tool Execution Events
```json
{"type": "tool_call", "tool": "tool_name", "args": "arguments", "result": {...}}
```

### AI Thinking Events
```json
{"type": "thinking", "content": "AI reasoning text"}
```

### Response Streaming Events
```json
{"type": "response_chunk", "content": "partial response text"}
```

### Grounding Events
```json
{"type": "grounding_web_search_queries", "queries": ["query1", "query2"]}
{"type": "grounding_chunks", "sources": [{"uri": "string", "title": "string"}]}
```

### Final Response Event
```json
{"type": "response", "response": "complete response", "grounding_metadata": {...}}
```

### End Event
```json
{"type": "end"}
```

---

## Example Usage

### Creating a Chat and Asking a Question

```bash
# 1. Create a new chat
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/users/farmer123/chats" \
  -F "chat_name=Tomato Farming Help"

# Response: {"chat_id": "abc123", "user_id": "farmer123", "chat_name": "Tomato Farming Help"}

# 2. Ask a question
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/ask_stream" \
  -F "q=What's the best time to plant tomatoes in California?" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123" \
  -F "include_tools=weather_api,soil_api" \
  -F "logs=true"
```

### Uploading and Querying Files ✨ ENHANCED

```bash
# 1. Upload a PDF
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/upload/pdf" \
  -F "file=@farming_guide.pdf" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"

# 2. Upload a DOCX document for analysis
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/upload/docx" \
  -F "file=@research_paper.docx" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"

# 3. Upload an XLSX file for data analysis
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/upload/xlsx" \
  -F "file=@yield_data.xlsx" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"

# 4. List files in chat
curl "https://0c05cd19c9d5.ngrok-free.app/users/farmer123/chats/abc123/files"

# 5. Ask for data analysis with code execution
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/ask_stream" \
  -F "q=Analyze my yield data and create visualizations showing trends over time" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"

# 6. Ask for document analysis
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/ask_stream" \
  -F "q=Summarize the key findings from the uploaded research paper" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"

# 7. Combine file analysis with web research
curl -X POST "https://0c05cd19c9d5.ngrok-free.app/ask_stream" \
  -F "q=Compare my yield data with USDA national averages from https://usda.gov/crops" \
  -F "user_id=farmer123" \
  -F "chat_id=abc123"
```

---

## Development Notes ✨ ENHANCED

- The API automatically includes uploaded file summaries in AI responses
- **Code execution** runs in Gemini's secure environment with 30-second timeout
- **URL context** enables referencing external agricultural resources
- **DOCX files** are processed with python-docx for comprehensive analysis
- **XLSX files** are analyzed with pandas/openpyxl for data insights and visualizations
- Tool preferences are stored in memory and reset on server restart
- File processing happens in the background with status tracking
- Streaming responses support real-time interaction with code execution results
- CORS is enabled for all origins (should be restricted in production)
- **Multiturn conversations** maintain context across analysis steps

---

## Dependencies ✨ UPDATED

- FastAPI
- Google Generative AI (Gemini) with code execution and URL context
- **python-docx** - Word document processing
- **openpyxl** - Excel file processing  
- **pandas** - Data analysis (available in Gemini environment)
- **matplotlib** - Chart generation (available in Gemini environment)
- SQLite for data storage
- ChromaDB for vector storage
- Various agricultural data APIs
