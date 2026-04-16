
import os
import json
import hashlib
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)

_cache: dict = {}


def _get_groq_client():
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in .env file!")
    return Groq(api_key=api_key)


def _cache_key(text: str, task: str) -> str:
    """Generate cache key from text + task."""
    return hashlib.md5(f"{task}:{text[:200]}".encode()).hexdigest()


def _call_groq(prompt: str, task: str, text: str, max_tokens: int = 300) -> str:
    """
    Call Groq API with caching.
    Returns the response text.
    """
    key = _cache_key(text, task)
    if key in _cache:
        logger.info(f"Cache hit for task: {task}")
        return _cache[key]

    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        result = response.choices[0].message.content.strip()
        _cache[key] = result  # cache it
        return result
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return ""


def generate_summary(title: str, description: str) -> str:
    """Generate a 2-3 sentence summary of a book."""
    if not description:
        return ""

    prompt = f"""You are a book critic. Write a concise 2-3 sentence summary of the following book.
Be informative and engaging. Do NOT add any extra text or preamble.

Title: {title}
Description: {description}

Summary:"""

    return _call_groq(prompt, "summary", description, max_tokens=150)


def classify_genre(title: str, description: str) -> str:
    """Predict genre from title and description."""
    if not description:
        return "Fiction"

    prompt = f"""Based on the title and description below, classify this book into ONE of these genres:
Fiction, Non-Fiction, Mystery, Romance, Science Fiction, Fantasy, Biography, 
History, Self-Help, Horror, Thriller, Children, Poetry, Business, Travel

Return ONLY the genre name, nothing else.

Title: {title}
Description: {description}

Genre:"""

    result = _call_groq(prompt, "genre", description, max_tokens=10)
    return result if result else "Fiction"


def analyze_sentiment(description: str) -> str:
    """Analyze tone of book description. Returns: Positive / Neutral / Negative."""
    if not description:
        return "Neutral"

    prompt = f"""Analyze the overall tone and sentiment of this book description.
Return ONLY one word: Positive, Neutral, or Negative.

Description: {description}

Sentiment:"""

    result = _call_groq(prompt, "sentiment", description, max_tokens=5)
    result = result.strip().capitalize()
    if result not in ["Positive", "Neutral", "Negative"]:
        return "Neutral"
    return result


def generate_all_insights(title: str, description: str) -> dict:
    """
    Run all AI insights for a single book.
    Returns dict with summary, ai_genre, sentiment.
    """
    logger.info(f"Generating AI insights for: {title}")
    return {
        "ai_summary": generate_summary(title, description),
        "ai_genre": classify_genre(title, description),
        "sentiment": analyze_sentiment(description),
    }


def get_recommendations(book_title: str, book_genre: str, all_books: list) -> list:
    """
    Recommend books similar to the given book.
    Uses AI to select from the book list.
    Returns list of recommended book titles.
    """
    if len(all_books) < 2:
        return []

    # Build a small book list string (max 30 books to stay within token limit)
    sample = all_books[:30]
    book_list_str = "\n".join([f"- {b['title']} ({b.get('genre', 'Unknown')})" for b in sample])

    prompt = f"""Given that a user likes the book "{book_title}" (Genre: {book_genre}),
recommend 3 similar books from the list below. 
Return ONLY a JSON array of book titles, nothing else. Example: ["Book A", "Book B", "Book C"]

Available books:
{book_list_str}

Recommendations (JSON array only):"""

    result = _call_groq(prompt, "recommend", book_title + book_genre, max_tokens=100)

    try:
        # Clean markdown code fences if present
        clean = result.replace("```json", "").replace("```", "").strip()
        recommendations = json.loads(clean)
        if isinstance(recommendations, list):
            return [r for r in recommendations if r != book_title][:3]
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Could not parse recommendations JSON: {e}")

    return []
