import React, { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, MessageCircle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ChatBox from '../components/ChatBox'
import { Products } from '../services/api'
import './HomePage.css'

export default function HomePage({ refreshCart, pushNotification }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Products.getAll()
      .then(setProducts)
      .catch(() => pushNotification('Failed to load products', 'warning'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-text">
          <div className="hero-badge tag tag-purple">
            <Sparkles size={12} /> AI-Powered Shopping
          </div>
          <h1>Smart Shopping,<br /><span>Smarter Offers</span></h1>
          <p>Our AI watches your browsing and sends you the perfect message at the perfect time — because your time is valuable.</p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <TrendingUp size={20} />
            <strong>2x</strong>
            <span>Conversion Rate</span>
          </div>
          <div className="stat-card">
            <MessageCircle size={20} />
            <strong>AI</strong>
            <span>Smart Messages</span>
          </div>
          <div className="stat-card">
            <Sparkles size={20} />
            <strong>NLP</strong>
            <span>Intent Detection</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="products-section">
        <div className="section-header">
          <div className="section-header-text">
            <h2>Featured Products</h2>
            <p>Hover over a product to track views · Click "AI Nudge" to simulate smart messaging</p>
          </div>
        </div>
        {loading ? (
          <div className="products-loading">
            <div className="loading-spinner" style={{width:32, height:32, borderWidth:3}} />
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onCartUpdate={refreshCart}
                pushNotification={pushNotification}
              />
            ))}
          </div>
        )}
      </section>

      {/* Chat Section */}
      <section className="chat-section">
        <div className="section-header">
          <h2>AI Chat Assistant</h2>
          <p>Simulate user responses — our AI detects intent and responds accordingly</p>
        </div>
        <div className="chat-layout">
          <ChatBox pushNotification={pushNotification} />
          <div className="chat-info-panel">
            <h3>How It Works</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-num">1</div>
                <div>
                  <strong>User Browses</strong>
                  <p>We track views and cart actions in real time</p>
                </div>
              </div>
              <div className="flow-step">
                <div className="step-num">2</div>
                <div>
                  <strong>AI Triggers Message</strong>
                  <p>Gemini generates a personalised re-engagement message</p>
                </div>
              </div>
              <div className="flow-step">
                <div className="step-num">3</div>
                <div>
                  <strong>User Replies</strong>
                  <p>NLP classifies intent: buy, discount, or not interested</p>
                </div>
              </div>
              <div className="flow-step">
                <div className="step-num">4</div>
                <div>
                  <strong>Smart Action</strong>
                  <p>AI responds with discount offer, checkout link, or stops messaging</p>
                </div>
              </div>
            </div>
            <div className="intent-legend">
              <h4>Intent Labels</h4>
              <div className="intent-item"><span className="tag tag-yellow">💰 Price Concern</span><span>→ Offer discount</span></div>
              <div className="intent-item"><span className="tag tag-red">🚫 Not Interested</span><span>→ Stop messages</span></div>
              <div className="intent-item"><span className="tag tag-green">✅ Ready to Buy</span><span>→ Go to checkout</span></div>
              <div className="intent-item"><span className="tag tag-gray">🤔 Unknown</span><span>→ Ask for clarity</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
