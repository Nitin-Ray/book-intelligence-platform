import { useState, useEffect, useRef } from 'react'
import { askQuestion, getChatHistory } from '../api/api'

// Sample questions to show users
const SAMPLE_QUESTIONS = [
  "What are some mystery books available?",
  "Recommend me a book with a positive tone",
  "Which books are about travel?",
  "Tell me about science fiction books",
  "What books have the highest ratings?",
]

function ChatBubble({ item }) {
  return (
    <div className="space-y-3">
      {/* Question */}
      <div className="flex justify-end">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg text-sm">
          {item.question}
        </div>
      </div>

      {/* Answer */}
      <div className="flex justify-start gap-3">
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-1">
          🤖
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 leading-relaxed">
            {item.answer}
          </div>

          {/* Sources */}
          {item.sources && item.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-slate-500">Sources:</span>
              {item.sources.map((src, i) => (
                <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  📖 {src}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QAInterface() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  // Load existing chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await getChatHistory()
        setHistory(res.data.reverse()) // oldest first
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function handleAsk() {
    const q = question.trim()
    if (!q || loading) return

    setLoading(true)
    setError('')
    setQuestion('')

    try {
      const res = await askQuestion(q)
      setHistory((prev) => [...prev, res.data])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer. Make sure GROQ_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">🤖 Ask AI About Books</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Powered by Groq + RAG pipeline — ask anything about the books in the library
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-2xl border border-slate-700 p-4 space-y-6 min-h-0">
        {loadingHistory ? (
          <div className="text-center py-8 text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-6">
            <div>
              <p className="text-slate-400 text-center mb-4 text-sm">Try one of these questions:</p>
              <div className="flex flex-col gap-2">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    className="text-left text-sm text-indigo-300 bg-indigo-900/30 border border-indigo-800/50 hover:border-indigo-500 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {history.map((item, i) => (
              <ChatBubble key={item.history_id || i} item={item} />
            ))}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-lg flex-shrink-0">🤖</div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about books... (Enter to send)"
          rows={2}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex-shrink-0"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>

      <p className="text-xs text-slate-600 text-center mt-2">
        Press Enter to send • Shift+Enter for new line
      </p>
    </div>
  )
}
