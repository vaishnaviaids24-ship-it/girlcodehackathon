import React, { useState } from 'react'
import { ShoppingCart, Trash2, CreditCard, Package, Zap, ArrowLeft } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Cart as CartAPI, Messages } from '../services/api'
import './CartPage.css'

export default function CartPage({ cartItems, refreshCart, pushNotification }) {
  const [checkingOut, setCheckingOut] = useState(false)
  const [triggering, setTriggering]   = useState(null)

  const total    = cartItems.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  const handleRemove = async (cartId) => {
    await CartAPI.remove(cartId)
    refreshCart()
    pushNotification('Item removed from cart', 'info')
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    setCheckingOut(true)
    try {
      await CartAPI.checkout()
      refreshCart()
      pushNotification('Order placed successfully! 🎉', 'success')
    } catch {
      pushNotification('Checkout failed. Please try again.', 'warning')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleAbandonNudge = async (item) => {
    setTriggering(item.id)
    try {
      const result = await Messages.trigger('cart_no_checkout', item.product_id)
      pushNotification(`Smart message sent: "${result.message.message_text.slice(0, 55)}..."`, 'info')
    } catch {
      pushNotification('Could not trigger message.', 'warning')
    } finally {
      setTriggering(null)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="page-header">
          <h1>Your Cart</h1>
        </div>
        <div className="card empty-state" style={{ padding: '80px 24px' }}>
          <ShoppingCart size={56} strokeWidth={1.2} />
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <NavLink to="/" className="btn btn-primary" style={{ marginTop: 20, width: 'fit-content', margin: '20px auto 0' }}>
            <ArrowLeft size={16} /> Continue Shopping
          </NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>Your Cart</h1>
        <p>{itemCount} item{itemCount !== 1 ? 's' : ''} · ${total.toFixed(2)} total</p>
      </div>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item card">
              <div className="cart-item-image">
                {item.product?.image_url
                  ? <img src={item.product.image_url} alt={item.product?.name} />
                  : <Package size={32} />
                }
              </div>
              <div className="cart-item-info">
                <h3>{item.product?.name || 'Unknown Product'}</h3>
                <p>{item.product?.description?.slice(0, 80)}...</p>
                <div className="cart-item-meta">
                  <span className="cart-item-price">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                  <span className="cart-item-qty">Qty: {item.quantity}</span>
                  <span className="tag tag-gray">{item.status}</span>
                </div>
              </div>
              <div className="cart-item-actions">
                <button
                  className="btn btn-ghost btn-sm ai-cart-btn"
                  onClick={() => handleAbandonNudge(item)}
                  disabled={triggering === item.id}
                  title="Simulate abandon cart nudge"
                >
                  {triggering === item.id
                    ? <span className="loading-spinner" />
                    : <Zap size={14} />}
                  Nudge
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRemove(item.id)}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary card">
          <h3>Order Summary</h3>
          <div className="divider" />
          {cartItems.map(item => (
            <div key={item.id} className="summary-line">
              <span>{item.product?.name} × {item.quantity}</span>
              <span>${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="summary-line subtotal">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <span className="tag tag-green" style={{fontSize:'0.75rem'}}>Free</span>
          </div>
          <div className="divider" />
          <div className="summary-line total-line">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary btn-lg checkout-btn"
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut
              ? <><span className="loading-spinner" /> Processing...</>
              : <><CreditCard size={18} /> Checkout Now</>
            }
          </button>
          <NavLink to="/" className="btn btn-ghost continue-btn">
            <ArrowLeft size={15} /> Continue Shopping
          </NavLink>
        </div>
      </div>
    </div>
  )
}
