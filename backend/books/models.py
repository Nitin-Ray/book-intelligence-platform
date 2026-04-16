from django.db import models


class Book(models.Model):
    """
    Stores metadata for each scraped book.
    """
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=300, default='Unknown')
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    price = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    genre = models.CharField(max_length=200, blank=True)
    book_url = models.URLField(max_length=1000, unique=True)
    cover_image_url = models.URLField(max_length=1000, blank=True)

    # AI-generated fields
    ai_summary = models.TextField(blank=True)
    ai_genre = models.CharField(max_length=200, blank=True)
    sentiment = models.CharField(max_length=100, blank=True)  # positive / neutral / negative

    # Embedding stored in ChromaDB (we just track if it's been indexed)
    is_embedded = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class ChatHistory(models.Model):
    """
    Saves RAG Q&A history for bonus points.
    """
    question = models.TextField()
    answer = models.TextField()
    sources = models.JSONField(default=list)   # list of book titles used as context
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question[:80]

    class Meta:
        ordering = ['-created_at']
