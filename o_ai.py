from openai import OpenAI
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
from config import SYSTEM_PROMPT

load_dotenv()
ai = OpenAI()

def get_vector_db(collection_name: str):
    embedding_model = OpenAIEmbeddings(
        model = "text-embedding-3-small"
    )
    return QdrantVectorStore.from_existing_collection(
        embedding = embedding_model,
        url = "http://localhost:6333",
        collection_name = collection_name
    )

def o_ragnar():
    message_history = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    vector_db = get_vector_db("RAGNAR_OPENAI")

    while True:
        Ask = input("\n\033[95mType Here: \033[0m")
        if Ask.strip().lower() in {"exit", "quit", "q"}:
            print("Bye!")
            break

        vector_result = vector_db.similarity_search(query = Ask)
        context = "\n\n\n".join([f"Page Content: {res.page_content}\n Page Number: {res.metadata['page_label']}"
        for res in vector_result])

        message_history.append(
            {"role": "user",
            "content": f" Context: {context} \n User Question: {Ask} "
            }
        )

        while True:
            response = ai.chat.completions.create(
                model = "gpt-5.2",
                messages = message_history
            )

            result = response.choices[0].message.content
            message_history.append(
                {"role": "assistant", "content": result}
            )

            print(f"\n\033[98mRAGNAR: {result}\033[0m")
            break

def o_ragnar_chat(query: str, history: list, collection_name: str = "RAGNAR_OPENAI"):
    vector_db = get_vector_db(collection_name)

    vector_result = vector_db.similarity_search(query = query)
    context = "\n\n\n".join([f"Page Content: {res.page_content}\n Page Number: {res.metadata['page_label']}"
    for res in vector_result])

    formatted_history = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    for msg in history:
        formatted_history.append({"role": msg["role"], "content": msg["content"]})

    formatted_history.append(
        {"role": "user", "content": f" Context: {context} \n User Question: {query} "}
    )

    response = ai.chat.completions.create(
        model = "gpt-4o",
        messages = formatted_history
    )

    return response.choices[0].message.content

if __name__ == "__main__":
    o_ragnar()
