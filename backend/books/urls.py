from django.urls import path
from . import views

urlpatterns = [
    path('books/scrape/', views.scrape_and_store, name='scrape-books'),
    path('books/ask/', views.ask_question, name='ask-question'),
    path('books/', views.book_list, name='book-list'),
    path('books/<int:pk>/', views.book_detail, name='book-detail'),
    path('books/<int:pk>/recommendations/', views.book_recommendations, name='book-recommendations'),
    path('chat-history/', views.chat_history, name='chat-history'),
    path('stats/', views.stats, name='stats'),
]