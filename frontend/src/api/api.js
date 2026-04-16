import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

export const getBooks = (params = {}) => api.get('/books/', { params })
export const getBook = (id) => api.get(`/books/${id}/`)
export const getRecommendations = (id) => api.get(`/books/${id}/recommendations/`)
export const scrapeBooks = (maxPages) => api.post('/books/scrape/', { max_pages: maxPages })
export const askQuestion = (question) => api.post('/books/ask/', { question })
export const getChatHistory = () => api.get('/chat-history/')
export const getStats = () => api.get('/stats/')

export default api
