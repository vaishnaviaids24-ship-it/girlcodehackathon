import React, { useState } from 'react'
import { ShoppingCart, Eye, Zap, Package } from 'lucide-react'
import { Cart as CartAPI, Activity, Messages } from '../services/api'
import './ProductCard.css'

export default function ProductCard({ product, onCartUpdate, pushNotification }) {
  const [adding, setAdding]     = useState(false)
  const [viewed, setViewed]     = useState(false)
  const [triggering, setTriggering] = useState(false)

  const handleView = async () => {
    if (viewed) return
    setViewed(true)
    await Activity.track('view', product.id)
  }

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await CartAPI.add(product.id)
      await Activity.track('add_to_cart', product.id)
      onCartUpdate()
      pushNotification(`"${product.name}" added to cart!`, 'success')
    } catch {
      pushNotification('Failed to add to cart.', 'warning')
    } finally {
      setAdding(false)
    }
  }

  const handleTriggerMessage = async () => {
    setTriggering(true)
    try {
      const result = await Messages.trigger('view_no_cart', product.id)
      pushNotification(`Smart message sent: "${result.message.message_text.slice(0, 60)}..."`, 'info')
    } catch {
      pushNotification('Could not trigger message.', 'warning')
    } finally {
      setTriggering(false)
    }
  }

  const stockLabel = product.stock <= 5
    ? { text: `Only ${product.stock} left!`, cls: 'tag-red' }
    : product.stock <= 15
    ? { text: `${product.stock} in stock`, cls: 'tag-yellow' }
    : { text: 'In stock', cls: 'tag-green' }

  return (
    <div className="product-card card" onMouseEnter={handleView}>
      <div className="product-image-wrap">
        <img src={product.image_url} alt={product.name} loading="lazy" />
        <div className="product-overlay">
          <span className={`tag ${stockLabel.cls}`}>
            <Package size={11} /> {stockLabel.text}
          </span>
        </div>
        <div className={`product-viewed-badge ${viewed ? 'show' : ''}`}>
          <Eye size={12} /> Viewed
        </div>
      </div>

      <div className="product-body">
        <div className="product-category tag tag-purple">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <div className="product-actions">
            <button
              className="btn btn-ghost btn-sm ai-btn"
              onClick={handleTriggerMessage}
              disabled={triggering}
              title="Simulate AI nudge"
            >
              {triggering ? <span className="loading-spinner" /> : <Zap size={14} />}
              AI Nudge
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? <span className="loading-spinner" /> : <ShoppingCart size={14} />}
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
