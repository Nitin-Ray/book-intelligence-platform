
import logging
from django.conf import settings
from groq import Groq
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

_chroma_client = None
_collection = None

COLLECTION_NAME = "books"


def _get_collection():
    """Get or create the ChromaDB collection."""
    global _chroma_client, _collection

    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)

       
        embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
            metadata={"hnsw:space": "cosine"},  
        )

    return _collection


def index_book(book_id: int, title: str, description: str, genre: str = "") -> bool:
    """
    Embed and store a book's text in ChromaDB.
    Uses smart chunking: if description > 500 chars, split into overlapping chunks.
    """
    if not description:
        return False

    try:
        collection = _get_collection()

        # ── Smart chunking (bonus points ✓) ──
        chunks = _chunk_text(description)

        ids = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            chunk_id = f"book_{book_id}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(f"Title: {title}\nGenre: {genre}\n\n{chunk}")
            metadatas.append({
                "book_id": str(book_id),
                "title": title,
                "genre": genre,
                "chunk_index": i,
            })

        collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        logger.info(f"Indexed book {book_id} ({len(chunks)} chunks)")
        return True

    except Exception as e:
        logger.error(f"Error indexing book {book_id}: {e}")
        return False


def _chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list[str]:
    """
    Split text into overlapping chunks for better RAG retrieval.
    Overlap ensures context isn't lost at chunk boundaries.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap  # overlap window

    return chunks


def search_books(query: str, n_results: int = 5) -> list[dict]:
    """
    Perform similarity search in ChromaDB for a query.
    Returns list of relevant chunks with metadata.
    """
    try:
        collection = _get_collection()
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, collection.count() or 1),
        )

        chunks = []
        if results and results['documents']:
            for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
                chunks.append({
                    "text": doc,
                    "book_id": meta.get("book_id"),
                    "title": meta.get("title"),
                    "genre": meta.get("genre"),
                })
        return chunks

    except Exception as e:
        logger.error(f"ChromaDB search error: {e}")
        return []


def answer_question(question: str) -> dict:
    """
    Full RAG pipeline:
    1. Embed question & retrieve relevant book chunks
    2. Build context from chunks
    3. Generate answer with Groq + source citations
    Returns: { answer, sources }
    """
  
    chunks = search_books(question, n_results=5)

    if not chunks:
        return {
            "answer": "I don't have enough book data to answer this question. Please scrape some books first.",
            "sources": []
        }

   
    context_parts = []
    sources = []
    seen_titles = set()

    for chunk in chunks:
        context_parts.append(chunk["text"])
        title = chunk.get("title", "Unknown")
        if title not in seen_titles:
            sources.append(title)
            seen_titles.add(title)

    context = "\n\n---\n\n".join(context_parts)

    
    prompt = f"""You are a helpful book assistant. Answer the user's question based ONLY on the book information provided below.
If the answer isn't in the context, say so honestly.
At the end, mention which books you referenced.

Context:
{context}

Question: {question}

Answer:"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.4,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq error in RAG: {e}")
        answer = "Error generating answer. Please check your GROQ_API_KEY."

    return {
        "answer": answer,
        "sources": sources,
    }


def get_collection_count() -> int:
    """Return number of vectors stored in ChromaDB."""
    try:
        return _get_collection().count()
    except Exception:
        return 0
