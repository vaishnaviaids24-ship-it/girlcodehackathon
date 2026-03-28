import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Zap, Sparkles } from 'lucide-react'
import { Messages } from '../services/api'
import './ChatBox.css'

const INTENT_CONFIG = {
  price_concern:  { label: 'Price Concern',   cls: 'intent-yellow', emoji: '💰' },
  not_interested: { label: 'Not Interested',   cls: 'intent-red',    emoji: '🚫' },
  buy:            { label: 'Ready to Buy',     cls: 'intent-green',  emoji: '🛍️' },
  unknown:        { label: 'Unclear Intent',   cls: 'intent-gray',   emoji: '🤔' },
}

export default function ChatBox({ pushNotification }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm your AI shopping assistant. Try replying to a smart message or type something like \"too expensive\" or \"yes, I'll buy it\" to see intent detection in action.",
      timestamp: new Date(),
    }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg, timestamp: new Date() }])

  const sendReply = async (text) => {
    if (!text.trim()) return
    addMessage({ type: 'user', text })
    setInput('')
    setLoading(true)
    try {
      const result = await Messages.reply(text)
      addMessage({
        type: 'bot',
        text: result.follow_up_message,
        intent: result.intent,
        confidence: result.confidence,
        action: result.action,
      })
      pushNotification(`Intent detected: ${INTENT_CONFIG[result.intent]?.label || result.intent}`, 'info')
    } catch {
      addMessage({ type: 'bot', text: 'Sorry, something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(input) }
  }

  const QUICK_REPLIES = [
    { label: '💸 Too expensive', text: 'This is too expensive for me' },
    { label: '🚫 Not interested', text: 'No thanks, not interested' },
    { label: '✅ Yes, buy it!', text: 'Yes, I want to buy it!' },
    { label: '🤔 Maybe later', text: 'Maybe I will think about it' },
  ]

  return (
    <div className="chatbox card">
      <div className="chatbox-header">
        <div className="chatbox-avatar"><Bot size={18} /></div>
        <div>
          <h3>AI Assistant</h3>
          <span className="chatbox-status"><span className="status-dot" />Online</span>
        </div>
        <div className="chatbox-badge tag tag-purple"><Sparkles size={11}/> Gemini AI</div>
      </div>

      <div className="chatbox-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="chat-avatar bot-avatar"><Bot size={14} /></div>
            )}
            <div className="chat-bubble-col">
              <div className={`chat-bubble ${msg.type}`}>
                <p>{msg.text}</p>
              </div>
              {msg.intent && (
                <div className={`intent-badge ${INTENT_CONFIG[msg.intent]?.cls || 'intent-gray'}`}>
                  <span>{INTENT_CONFIG[msg.intent]?.emoji}</span>
                  <strong>{INTENT_CONFIG[msg.intent]?.label}</strong>
                  {msg.confidence && <span className="confidence">{Math.round(msg.confidence * 100)}% confident</span>}
                  {msg.action && <span className="action-tag">→ {msg.action.replace(/_/g, ' ')}</span>}
                </div>
              )}
              <span className="chat-time">
                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.type === 'user' && (
              <div className="chat-avatar user-avatar"><User size={14} /></div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrap bot">
            <div className="chat-avatar bot-avatar"><Bot size={14} /></div>
            <div className="chat-bubble bot typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="quick-replies">
        {QUICK_REPLIES.map(q => (
          <button key={q.text} className="quick-reply-btn" onClick={() => sendReply(q.text)} disabled={loading}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="chatbox-input-row">
        <input
          className="chatbox-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply... (e.g. 'too expensive', 'yes!')"
          disabled={loading}
        />
        <button
          className="btn btn-primary send-btn"
          onClick={() => sendReply(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? <span className="loading-spinner" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
