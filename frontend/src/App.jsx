import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import BookDetail from './pages/BookDetail'
import QAInterface from './pages/QAInterface'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/ask" element={<QAInterface />} />
        </Routes>
      </main>
    </div>
  )
}
