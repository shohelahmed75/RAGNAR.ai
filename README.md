# RAGNAR - Document Intelligence Engine

RAGNAR is an advanced Retrieval-Augmented Generation (RAG) AI assistant. It functions as a trusted document intelligence engine designed to answer questions strictly based on a provided knowledge base (`Q&A.pdf`). 

It dynamically supports both **OpenAI** and **Google Gemini** models depending on your available API keys, and utilizes **Qdrant** as a local vector database for fast and accurate context retrieval.

## Features

- **Multi-Provider Support:** Automatically detects your `.env` configuration to use either OpenAI (GPT) or Google Gemini.
- **Conversational Memory:** Remembers your past questions and context within a continuous chat session.
- **Local Vector Database:** Uses Qdrant via Docker to securely store and retrieve embeddings locally.
- **Strict Contextual Answers:** Grounded specifically on the provided PDF document to prevent hallucinations.
- **Dynamic Ingestion:** Built with LangChain's text splitters and PDF loaders for seamless document parsing.

## Prerequisites

- **Python 3.10+**
- **Docker** & **Docker Compose** (to run the Qdrant database)
- An API Key from either **OpenAI** or **Google (Gemini)**

## Installation & Setup

1. **Clone the repository and navigate to the directory:**
   ```bash
   git clone <your-repo-url>
   cd Genai
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # .\venv\Scripts\activate # On Windows
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r req.txt
   ```

4. **Start the Qdrant Vector Database:**
   ```bash
   docker-compose up -d
   ```
   *(This starts Qdrant locally on port 6333)*

5. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your preferred API keys. You only need one, but you can provide both:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   ```

## Usage

1. **Ingest the Knowledge Base:**
   Before chatting, you need to embed the `Q&A.pdf` document into your local Qdrant database.
   ```bash
   python rag.py
   ```

2. **Start the Chat Interface:**
   Launch the CLI assistant. It will automatically route to the correct AI provider based on your `.env` file.
   ```bash
   python chat.py
   ```

3. **Interact with RAGNAR:**
   Type your questions directly into the terminal. RAGNAR will retrieve the relevant context and provide an accurate answer.
   - To exit the session, type `exit`, `quit`, or `q`.

## Project Structure

- **`chat.py`**: The main entry point. Automatically initializes the chat interface based on available API keys.
- **`rag.py`**: Handles document loading (`PyPDFLoader`), text chunking (`RecursiveCharacterTextSplitter`), embedding generation, and Qdrant ingestion.
- **`g_ai.py`**: Google Gemini chat implementation featuring multi-turn memory integration.
- **`o_ai.py`**: OpenAI chat implementation featuring multi-turn memory integration.
- **`docker-compose.yml`**: Docker configuration for spinning up the local Qdrant service.
- **`req.txt`**: List of required Python packages and dependencies.
- **`Q&A.pdf`**: The sample knowledge base used for context retrieval.
