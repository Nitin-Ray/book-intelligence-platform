
import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Book, ChatHistory
from .serializers import BookListSerializer, BookDetailSerializer, ChatHistorySerializer
from .scraper import scrape_books
from .ai_insights import generate_all_insights, get_recommendations
from .rag_pipeline import index_book, answer_question, get_collection_count

logger = logging.getLogger(__name__)

@api_view(['GET'])
def book_list(request):
  
    books = Book.objects.all()

    
    search = request.query_params.get('search', '')
    genre = request.query_params.get('genre', '')

    if search:
        books = books.filter(title__icontains=search)
    if genre:
        books = books.filter(genre__icontains=genre)

    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(books, request)

    serializer = BookListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)



@api_view(['GET'])
def book_detail(request, pk):
    
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = BookDetailSerializer(book)
    return Response(serializer.data)

@api_view(['GET'])
def book_recommendations(request, pk):
   
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

 
    all_books = list(Book.objects.exclude(pk=pk).values('title', 'genre'))

    recommended_titles = get_recommendations(
        book_title=book.title,
        book_genre=book.genre or book.ai_genre,
        all_books=all_books,
    )

 
    recommended_books = Book.objects.filter(title__in=recommended_titles)
    serializer = BookListSerializer(recommended_books, many=True)

    return Response({
        "source_book": book.title,
        "recommendations": serializer.data
    })

@api_view(['POST'])
def scrape_and_store(request):
    """
    POST /api/books/scrape/
    Body: { "max_pages": 3 }
    Scrapes books.toscrape.com and stores them with AI insights.
    """
    max_pages = request.data.get('max_pages', 3)

    try:
        max_pages = int(max_pages)
        max_pages = min(max_pages, 10)  
    except (ValueError, TypeError):
        max_pages = 3

    logger.info(f"Starting scrape for {max_pages} pages...")
    scraped = scrape_books(max_pages=max_pages)

    new_count = 0
    skipped_count = 0
    ai_failed = 0

    for book_data in scraped:
        # Skip if already exists
        if Book.objects.filter(book_url=book_data['book_url']).exists():
            skipped_count += 1
            continue

        try:
            insights = generate_all_insights(
                title=book_data['title'],
                description=book_data.get('description', '')
            )
        except Exception as e:
            logger.error(f"AI insight error: {e}")
            insights = {"ai_summary": "", "ai_genre": "", "sentiment": ""}
            ai_failed += 1

    
        book = Book.objects.create(
            title=book_data['title'],
            author=book_data.get('author', 'Unknown'),
            rating=book_data.get('rating', 0.0),
            reviews_count=book_data.get('reviews_count', 0),
            price=book_data.get('price', ''),
            description=book_data.get('description', ''),
            genre=book_data.get('genre', ''),
            book_url=book_data['book_url'],
            cover_image_url=book_data.get('cover_image_url', ''),
            ai_summary=insights.get('ai_summary', ''),
            ai_genre=insights.get('ai_genre', ''),
            sentiment=insights.get('sentiment', ''),
        )

      
        try:
            success = index_book(
                book_id=book.id,
                title=book.title,
                description=book.description,
                genre=book.genre,
            )
            if success:
                book.is_embedded = True
                book.save(update_fields=['is_embedded'])
        except Exception as e:
            logger.error(f"Embedding error for book {book.id}: {e}")

        new_count += 1

    return Response({
        "message": "Scraping complete!",
        "total_scraped": len(scraped),
        "new_books_added": new_count,
        "skipped_duplicates": skipped_count,
        "ai_failures": ai_failed,
        "chroma_vectors": get_collection_count(),
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def ask_question(request):
    """
    POST /api/books/ask/
    Body: { "question": "What are some mystery books?" }
    Returns AI-generated answer with source book citations.
    """
    question = request.data.get('question', '').strip()

    if not question:
        return Response(
            {"error": "Please provide a question."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(question) > 500:
        return Response(
            {"error": "Question too long (max 500 characters)."},
            status=status.HTTP_400_BAD_REQUEST
        )

    logger.info(f"RAG query: {question}")
    result = answer_question(question)

    chat = ChatHistory.objects.create(
        question=question,
        answer=result['answer'],
        sources=result['sources'],
    )

    return Response({
        "question": question,
        "answer": result['answer'],
        "sources": result['sources'],
        "history_id": chat.id,
    })
@api_view(['GET'])
def chat_history(request):
    """
    GET /api/chat-history/
    Returns saved Q&A history (last 50).
    """
    history = ChatHistory.objects.all()[:50]
    serializer = ChatHistorySerializer(history, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def stats(request):
    """
    GET /api/stats/
    Returns quick platform stats.
    """
    return Response({
        "total_books": Book.objects.count(),
        "embedded_books": Book.objects.filter(is_embedded=True).count(),
        "chroma_vectors": get_collection_count(),
        "total_questions_asked": ChatHistory.objects.count(),
    })
