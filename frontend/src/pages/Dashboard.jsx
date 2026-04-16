import { useState, useEffect, useCallback } from 'react'
import { getBooks, getStats } from '../api/api'
import BookCard from '../components/BookCard'
import ScrapeModal from '../components/ScrapeModal'

export default function Dashboard() {
  const [books, setBooks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showScrapeModal, setShowScrapeModal] = useState(false)

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBooks({ search, genre, page })
      setBooks(res.data.results || [])
      const count = res.data.count || 0
      setTotalPages(Math.ceil(count / 20))
    } catch (err) {
      console.error('Failed to fetch books:', err)
    } finally {
      setLoading(false)
    }
  }, [search, genre, page])

  // Fetch platform stats
  const fetchStats = async () => {
    try {
      const res = await getStats()
      setStats(res.data)
    } catch (err) {
      console.error('Stats fetch failed:', err)
    }
  }

  useEffect(() => { fetchBooks() }, [fetchBooks])
  useEffect(() => { fetchStats() }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchBooks() }, 400)
    return () => clearTimeout(timer)
  }, [search, genre])

  function handleScrapeSuccess() {
    fetchBooks()
    fetchStats()
  }

  return (
    <div>
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Books', value: stats.total_books, icon: '📚' },
            { label: 'AI Indexed', value: stats.embedded_books, icon: '🧠' },
            { label: 'Vectors', value: stats.chroma_vectors, icon: '🔢' },
            { label: 'Questions Asked', value: stats.total_questions_asked, icon: '💬' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📚 Book Library</h1>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered book discovery platform</p>
        </div>
        <button
          onClick={() => setShowScrapeModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          🕷️ Scrape Books
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Search books by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <input
          type="text"
          placeholder="🏷️ Filter by genre..."
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="sm:w-48 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-4xl animate-spin mb-3">⏳</div>
            <p className="text-slate-400">Loading books...</p>
          </div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-300 font-medium">No books found</p>
          <p className="text-slate-500 text-sm mt-1">
            Click <strong>Scrape Books</strong> to fetch books from the web!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Scrape Modal */}
      {showScrapeModal && (
        <ScrapeModal
          onClose={() => setShowScrapeModal(false)}
          onSuccess={handleScrapeSuccess}
        />
      )}
    </div>
  )
}
