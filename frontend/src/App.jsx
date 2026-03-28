import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, LayoutDashboard, Store, Bot, Bell, X, CheckCircle, AlertCircle } from 'lucide-react'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import DashboardPage from './pages/DashboardPage'
import { Cart as CartAPI } from './services/api'
import './App.css'

export default function App() {
  const [cartItems, setCartItems]     = useState([])
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()

  const refreshCart = useCallback(async () => {
    try {
      const data = await CartAPI.get()
      setCartItems(data)
    } catch {}
  }, [])

  useEffect(() => { refreshCart() }, [refreshCart])

  const pushNotification = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, msg, type }])
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 4500)
  }, [])

  const dismissNotif = (id) => setNotifications(n => n.filter(x => x.id !== id))

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            <Bot size={22} strokeWidth={2.2} />
            <span>ShopAI</span>
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Store size={17} /> Shop
            </NavLink>
            <NavLink to="/cart" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShoppingCart size={17} />
              Cart
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </NavLink>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={17} /> Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <HomePage refreshCart={refreshCart} pushNotification={pushNotification} />
          }/>
          <Route path="/cart" element={
            <CartPage cartItems={cartItems} refreshCart={refreshCart} pushNotification={pushNotification} />
          }/>
          <Route path="/dashboard" element={
            <DashboardPage pushNotification={pushNotification} />
          }/>
        </Routes>
      </main>

      {/* ── Toast Notifications ── */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast toast-${n.type}`}>
            {n.type === 'success' ? <CheckCircle size={16}/> : <Bell size={16}/>}
            <span>{n.msg}</span>
            <button className="toast-close" onClick={() => dismissNotif(n.id)}><X size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}
