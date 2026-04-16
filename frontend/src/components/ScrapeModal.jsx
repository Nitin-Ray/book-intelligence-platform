import { useState } from 'react'
import { scrapeBooks } from '../api/api'

export default function ScrapeModal({ onClose, onSuccess }) {
  const [pages, setPages] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleScrape() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await scrapeBooks(pages)
      setResult(res.data)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Scraping failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">🕷️ Scrape Books</h2>
        <p className="text-sm text-slate-400 mb-4">
          Fetches books from books.toscrape.com and generates AI insights automatically.
        </p>

        {/* Pages slider */}
        <div className="mb-5">
          <label className="block text-sm text-slate-300 mb-2">
            Pages to scrape: <span className="text-indigo-400 font-bold">{pages}</span>
            <span className="text-slate-500 ml-2">(~{pages * 20} books)</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 page</span>
            <span>10 pages</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-4 text-xs text-yellow-300">
          ⚠️ Each book requires a Groq API call for AI insights. More pages = more API calls.
        </div>

        {/* Result */}
        {result && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-4 text-sm text-green-300 space-y-1">
            <p>✅ <strong>{result.new_books_added}</strong> new books added</p>
            <p>⏭️ <strong>{result.skipped_duplicates}</strong> duplicates skipped</p>
            <p>🧮 <strong>{result.chroma_vectors}</strong> vectors in ChromaDB</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Scraping...
                </>
              ) : (
                '🚀 Start Scraping'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
