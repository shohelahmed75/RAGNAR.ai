from google import genai
from google.genai import types
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from config import SYSTEM_PROMPT

load_dotenv()
ai = genai.Client()

def get_vector_db(collection_name: str):
    embedding_model = GoogleGenerativeAIEmbeddings(
        model = "gemini-embedding-001"
    )
    return QdrantVectorStore.from_existing_collection(
        embedding = embedding_model,
        url = "http://localhost:6333",
        collection_name = collection_name
    )

def g_ragnar():    
    message_history = []
    vector_db = get_vector_db("RAGNAR_GOOGLE")

    while True:
        Ask = input("\n\033[96mType Here: \033[0m")
        if Ask.strip().lower() in {"exit", "quit", "q"}:
            print("Goodbye")
            break

        vector_result = vector_db.similarity_search(query = Ask)
        context = "\n\n\n".join([f"Page Content: {res.page_content}\nPage Number: {res.metadata['page_label']}"
        for res in vector_result])
        assistant = ""

        message_history.append(
            {"role": "user", "parts": [{"text": f"context: {context}\n\nuser question: {Ask}"}]}
        )

        while True:
            response = ai.models.generate_content_stream(
                model = "gemini-2.5-pro",
                contents = message_history,
                config = types.GenerateContentConfig(
                    system_instruction = SYSTEM_PROMPT
                )
            )
            
            print("\n\033[92mRAGNAR:\033[0m")
            for chunk in response:
                print(chunk.text, end="", flush=True)
                assistant += chunk.text
            print("\n")
            
            message_history.append(
                {"role": "model", "parts": [{"text": assistant}]}
            )
            break

def g_ragnar_chat(query: str, history: list, collection_name: str = "RAGNAR_GOOGLE"):
    vector_db = get_vector_db(collection_name)

    vector_result = vector_db.similarity_search(query = query)
    context = "\n\n\n".join([f"Page Content: {res.page_content}\nPage Number: {res.metadata['page_label']}"
    for res in vector_result])

    formatted_history = []
    for msg in history:
        formatted_history.append({"role": msg["role"], "parts": [{"text": msg["content"]}]})

    formatted_history.append(
        {"role": "user", "parts": [{"text": f"context: {context}\n\nuser question: {query}"}]}
    )

    response = ai.models.generate_content(
        model = "gemini-3-flash-preview",
        contents = formatted_history,
        config = types.GenerateContentConfig(
            system_instruction = SYSTEM_PROMPT
        )
    )
    return response.text

if __name__ == "__main__":
    g_ragnar()
