#!/bin/bash
# Quick setup script for Book Intelligence Platform

echo "🧠 Book Intelligence Platform - Setup"
echo "======================================="

# Backend
echo ""
echo "📦 Setting up backend..."
cd backend
python -m venv venv
source venv/bin/activate 2>/dev/null || venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
echo ""
echo "⚠️  IMPORTANT: Add your GROQ_API_KEY to backend/.env"
echo "   Get free key at: https://console.groq.com"
echo ""
python manage.py migrate
echo "✅ Backend ready!"

# Frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend
npm install
echo "✅ Frontend ready!"

echo ""
echo "🚀 To start the application:"
echo "   Terminal 1: cd backend && python manage.py runserver"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "   Then open: http://localhost:3000"
