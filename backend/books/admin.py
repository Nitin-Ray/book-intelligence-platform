from django.contrib import admin
from .models import Book, ChatHistory

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'rating', 'sentiment', 'is_embedded', 'created_at']
    search_fields = ['title', 'author', 'genre']
    list_filter = ['genre', 'sentiment', 'is_embedded']

@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ['question', 'created_at']
