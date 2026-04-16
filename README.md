# 🧠 Book Intelligence Platform

A full-stack AI-powered web application that scrapes books, generates insights using LLM, and supports intelligent Q&A via a RAG pipeline.

> Built for the Ergosphere Solutions internship assignment.

---

## 📸 Screenshots

> Add screenshots here after running the app:
> 1. `docs/dashboard.png` — Book listing page
> 2. `docs/book-detail.png` — Book detail with AI insights
> 3. `docs/qa-interface.png` — AI Q&A chat interface
> 4. `docs/scrape-modal.png` — Scrape books modal

---

## 🏗️ Architecture

```
┌─────────────────┐     REST API      ┌──────────────────────────────┐
│  React Frontend  │ ◄────────────── ► │   Django REST Framework       │
│  (Tailwind CSS)  │                   │                              │
└─────────────────┘                   │  ┌──────────┐  ┌──────────┐  │
                                      │  │  SQLite  │  │ ChromaDB │  │
                                      │  └──────────┘  └──────────┘  │
                                      │                              │
                                      │  ┌──────────┐  ┌──────────┐  │
                                      │  │  Scraper │  │  Groq AI │  │
                                      │  └──────────┘  └──────────┘  │
                                      └──────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Django 4.2 + Django REST Framework |
| Database | SQLite (metadata) + ChromaDB (vectors) |
| AI / LLM | Groq API (Llama 3.3 70B) — free tier |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Scraping | requests + BeautifulSoup4 |

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free [Groq API Key](https://console.groq.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/book-intelligence-platform.git
cd book-intelligence-platform
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

### 4. Scrape Books

Once both servers are running:
1. Open `http://localhost:3000`
2. Click **"Scrape Books"** button
3. Choose number of pages (3 pages ≈ 60 books)
4. Click **"Start Scraping"**

The scraper will:
- Fetch books from [books.toscrape.com](https://books.toscrape.com)
- Generate AI insights (summary, genre, sentiment) via Groq
- Store vectors in ChromaDB for RAG queries

---

## 📡 API Documentation

Base URL: `http://localhost:8000/api/`

### GET `/api/books/`
List all books with pagination.

**Query Parameters:**
- `search` — Filter by title
- `genre` — Filter by genre
- `page` — Page number

**Response:**
```json
{
  "count": 120,
  "next": "http://localhost:8000/api/books/?page=2",
  "results": [
    {
      "id": 1,
      "title": "A Light in the Attic",
      "author": "Unknown",
      "rating": 3.0,
      "price": "£51.77",
      "genre": "Poetry",
      "ai_genre": "Poetry",
      "sentiment": "Positive",
      "book_url": "https://books.toscrape.com/...",
      "cover_image_url": "https://books.toscrape.com/..."
    }
  ]
}
```

---

### GET `/api/books/<id>/`
Get full book details including AI insights.

**Response:**
```json
{
  "id": 1,
  "title": "A Light in the Attic",
  "description": "...",
  "ai_summary": "A whimsical poetry collection exploring...",
  "ai_genre": "Poetry",
  "sentiment": "Positive",
  "is_embedded": true
}
```

---

### GET `/api/books/<id>/recommendations/`
Get AI-recommended similar books.

**Response:**
```json
{
  "source_book": "A Light in the Attic",
  "recommendations": [ { "id": 5, "title": "..." }, ... ]
}
```

---

### POST `/api/books/scrape/`
Trigger the web scraper.

**Body:**
```json
{ "max_pages": 3 }
```

**Response:**
```json
{
  "message": "Scraping complete!",
  "total_scraped": 60,
  "new_books_added": 58,
  "skipped_duplicates": 2,
  "chroma_vectors": 145
}
```

---

### POST `/api/books/ask/`
Ask a question using the RAG pipeline.

**Body:**
```json
{ "question": "What are some mystery books?" }
```

**Response:**
```json
{
  "question": "What are some mystery books?",
  "answer": "Based on the library, here are some mystery books...",
  "sources": ["Sharp Objects", "The Girl on the Train"],
  "history_id": 7
}
```

---

### GET `/api/chat-history/`
Get saved Q&A history (last 50).

---

### GET `/api/stats/`
Get platform statistics.

**Response:**
```json
{
  "total_books": 120,
  "embedded_books": 118,
  "chroma_vectors": 310,
  "total_questions_asked": 25
}
```

---

## 💬 Sample Questions & Answers

**Q: What mystery books are available?**
> Based on the library, there are several mystery books including "Sharp Objects" by Gillian Flynn — a dark thriller about a journalist investigating murders in her hometown...
> *Sources: Sharp Objects, Gone Girl*

**Q: Recommend a book with a positive tone**
> I recommend "The Midnight Library" — it has an uplifting sentiment with themes of hope and second chances...
> *Sources: The Midnight Library*

**Q: Which books are about travel?**
> The library contains travel-themed books such as "In a Dark, Dark Wood" and several non-fiction travel memoirs...
> *Sources: Travel genre books*

---

## ✨ Features

### Core Features
- ✅ Web scraping (books.toscrape.com, multi-page)
- ✅ AI Summary generation (Groq / Llama 3)
- ✅ AI Genre Classification
- ✅ Sentiment Analysis (Positive / Neutral / Negative)
- ✅ Recommendation Engine ("If you like X, you'll like Y")
- ✅ RAG Pipeline (ChromaDB + embeddings + LLM)
- ✅ REST APIs (GET + POST)
- ✅ React frontend (3 pages)

### Bonus Features Implemented
- ✅ **Caching** — AI responses cached in memory (avoids repeated Groq calls)
- ✅ **Smart chunking** — Overlapping window chunking for better RAG retrieval
- ✅ **Multi-page scraping** — Configurable pages (1–10)
- ✅ **Chat history** — All Q&A sessions saved to database
- ✅ **Loading states** — Animated loading indicators throughout UI
- ✅ **Search & filter** — Real-time book search and genre filter
- ✅ **Pagination** — Backend + frontend pagination

---

## 📁 Project Structure

```
book-intelligence-platform/
├── backend/
│   ├── core/                  # Django project settings
│   ├── books/
│   │   ├── models.py          # Book + ChatHistory models
│   │   ├── views.py           # All API endpoints
│   │   ├── serializers.py     # DRF serializers
│   │   ├── scraper.py         # Web scraper
│   │   ├── ai_insights.py     # Groq AI integration
│   │   ├── rag_pipeline.py    # ChromaDB + RAG
│   │   └── urls.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx   # Book listing
        │   ├── BookDetail.jsx  # Book detail + AI insights
        │   └── QAInterface.jsx # Chat Q&A interface
        ├── components/
        │   ├── Navbar.jsx
        │   ├── BookCard.jsx
        │   └── ScrapeModal.jsx
        └── api/
            └── api.js          # Axios API calls
```
