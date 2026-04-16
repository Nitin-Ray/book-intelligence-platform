import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBook, getRecommendations } from '../api/api'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 min-w-28">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  )
}

function Badge({ children, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-900/60 text-indigo-300',
    green: 'bg-green-900/60 text-green-300',
    yellow: 'bg-yellow-900/60 text-yellow-300',
    red: 'bg-red-900/60 text-red-300',
    slate: 'bg-slate-700 text-slate-300',
  }
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export default function BookDetail() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getBook(id)
        setBook(res.data)

        // Fetch recommendations
        setRecsLoading(true)
        const recRes = await getRecommendations(id)
        setRecs(recRes.data.recommendations || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setRecsLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-3">⏳</div>
          <p className="text-slate-400">Loading book details...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-400">Book not found.</p>
        <Link to="/" className="text-indigo-400 hover:underline mt-2 inline-block">← Back to Library</Link>
      </div>
    )
  }

  const sentimentColor = { Positive: 'green', Neutral: 'slate', Negative: 'red' }[book.sentiment] || 'slate'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        ← Back to Library
      </Link>

      {/* Main Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-6 p-6">

          {/* Cover */}
          <div className="flex-shrink-0">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-40 h-56 object-cover rounded-xl shadow-lg"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-40 h-56 bg-slate-700 rounded-xl flex items-center justify-center text-5xl">
                📖
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-white leading-snug">{book.title}</h1>
            <p className="text-slate-400">by {book.author || 'Unknown'}</p>

            {/* Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-lg ${s <= Math.round(book.rating) ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
              ))}
              <span className="text-sm text-slate-400 ml-2">{book.rating?.toFixed(1)} rating</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {(book.ai_genre || book.genre) && <Badge>{book.ai_genre || book.genre}</Badge>}
              {book.sentiment && <Badge color={sentimentColor}>{book.sentiment} Tone</Badge>}
              {book.price && <Badge color="green">{book.price}</Badge>}
            </div>

            {/* Meta info */}
            <div className="space-y-1.5 mt-1">
              <InfoRow label="Scraped Genre" value={book.genre} />
              <InfoRow label="Reviews" value={book.reviews_count > 0 ? `${book.reviews_count} reviews` : null} />
              <InfoRow label="Added on" value={new Date(book.created_at).toLocaleDateString()} />
            </div>

            {/* External link */}
            {book.book_url && (
              <a
                href={book.book_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
              >
                🔗 View on books.toscrape.com
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="border-t border-slate-700 px-6 py-5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">📝 Description</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{book.description}</p>
          </div>
        )}

        {/* AI Insights */}
        {(book.ai_summary || book.ai_genre || book.sentiment) && (
          <div className="border-t border-slate-700 px-6 py-5 bg-indigo-950/30">
            <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-4">🤖 AI Insights</h2>
            <div className="grid sm:grid-cols-2 gap-4">

              {book.ai_summary && (
                <div className="bg-slate-800 rounded-xl p-4">
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{book.ai_summary}</p>
                </div>
              )}

              <div className="space-y-3">
                {book.ai_genre && (
                  <div className="bg-slate-800 rounded-xl p-4">
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-1">AI Genre Prediction</h3>
                    <p className="text-indigo-300 font-semibold">{book.ai_genre}</p>
                  </div>
                )}
                {book.sentiment && (
                  <div className="bg-slate-800 rounded-xl p-4">
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sentiment Analysis</h3>
                    <p className={`font-semibold ${sentimentColor === 'green' ? 'text-green-300' : sentimentColor === 'red' ? 'text-red-300' : 'text-slate-300'}`}>
                      {book.sentiment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">
          ✨ You Might Also Like
        </h2>
        {recsLoading ? (
          <p className="text-slate-400 text-sm">Finding recommendations...</p>
        ) : recs.length === 0 ? (
          <p className="text-slate-500 text-sm">No recommendations yet. Try scraping more books!</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {recs.map((rec) => (
              <Link
                key={rec.id}
                to={`/books/${rec.id}`}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-indigo-500 transition-colors flex gap-3"
              >
                {rec.cover_image_url ? (
                  <img src={rec.cover_image_url} alt={rec.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📖</div>
                )}
                <div>
                  <p className="text-sm font-medium text-white line-clamp-2">{rec.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{rec.ai_genre || rec.genre}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
