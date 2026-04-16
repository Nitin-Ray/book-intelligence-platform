from rest_framework import serializers
from .models import Book, ChatHistory


class BookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for book listing page."""
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'rating', 'price',
            'genre', 'ai_genre', 'book_url', 'cover_image_url',
            'sentiment', 'created_at'
        ]


class BookDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = Book
        fields = '__all__'


class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = '__all__'
