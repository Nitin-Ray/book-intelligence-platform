import { Link } from 'react-router-dom'

// Star rating display
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-600'}`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-slate-400 ml-1">({rating.toFixed(1)})</span>
    </div>
  )
}

// Sentiment badge
function SentimentBadge({ sentiment }) {
  const colors = {
    Positive: 'bg-green-900 text-green-300',
    Neutral: 'bg-slate-700 text-slate-300',
    Negative: 'bg-red-900 text-red-300',
  }
  if (!sentiment) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[sentiment] || colors.Neutral}`}>
      {sentiment}
    </span>
  )
}

export default function BookCard({ book }) {
  const genre = book.ai_genre || book.genre || 'Unknown'

  return (
    <Link
      to={`/books/${book.id}`}
      className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-900/30 transition-all duration-200 flex flex-col group"
    >
      {/* Cover Image */}
      <div className="h-48 bg-slate-700 overflow-hidden">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📖
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
          {book.title}
        </h3>

        <p className="text-xs text-slate-400">{book.author}</p>

        <Stars rating={book.rating} />

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
          {/* Genre tag */}
          <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full">
            {genre}
          </span>

          <SentimentBadge sentiment={book.sentiment} />

          {book.price && (
            <span className="text-xs text-emerald-400 font-medium ml-auto">
              {book.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
