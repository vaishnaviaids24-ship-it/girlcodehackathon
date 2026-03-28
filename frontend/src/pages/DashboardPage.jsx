import React, { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard, Users, MessageCircle, Activity, Zap, RefreshCw,
  TrendingUp, ShoppingCart, Brain, Send, CheckCircle, XCircle, Clock, ChevronRight
} from 'lucide-react'
import { Admin, Messages, Products } from '../services/api'
import './DashboardPage.css'

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const INTENT_COLORS = {
  price_concern:  { bg: 'var(--warning-light)',  text: '#d97706', label: '💰 Price Concern' },
  not_interested: { bg: 'var(--danger-light)',   text: '#dc2626', label: '🚫 Not Interested' },
  buy:            { bg: 'var(--success-light)',  text: '#16a34a', label: '✅ Buy' },
  unknown:        { bg: 'var(--bg)',             text: 'var(--text-muted)', label: '🤔 Unknown' },
}

const ACTION_ICONS = {
  view: <Activity size={13} />,
  add_to_cart: <ShoppingCart size={13} />,
  checkout: <CheckCircle size={13} />,
  smart_message_sent: <Send size={13} />,
  chat_reply: <MessageCircle size={13} />,
}

export default function DashboardPage({ pushNotification }) {
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(1)
  const [triggerType, setTriggerType] = useState('view_no_cart')
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, p] = await Promise.all([Admin.stats(), Admin.users(), Products.getAll()])
      setStats(s)
      setUsers(u)
      setProducts(p)
    } catch {
      pushNotification('Failed to load dashboard data', 'warning')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleTrigger = async () => {
    setTriggerLoading(true)
    try {
      const result = await Messages.trigger(triggerType, selectedProduct)
      pushNotification(`AI Message sent: "${result.message.message_text.slice(0, 60)}..."`, 'success')
      loadData()
    } catch {
      pushNotification('Failed to trigger message', 'warning')
    } finally {
      setTriggerLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    { icon: <Users size={20} />,        label: 'Total Users',      value: stats?.total_users || 0,       color: 'purple' },
    { icon: <ShoppingCart size={20} />, label: 'Active Cart Items', value: stats?.total_cart_items || 0,  color: 'blue' },
    { icon: <MessageCircle size={20} />,label: 'Messages Sent',    value: stats?.total_messages || 0,    color: 'green' },
    { icon: <Activity size={20} />,     label: 'User Activities',  value: stats?.total_activities || 0,  color: 'yellow' },
  ]

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Real-time AI messaging analytics and controls</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card-dash card color-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {['overview', 'users', 'messages', 'activities'].map(t => (
          <button
            key={t}
            className={`dash-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="overview-grid">
          {/* Trigger Panel */}
          <div className="card trigger-panel">
            <div className="panel-header">
              <Brain size={18} />
              <h3>Trigger Smart Message</h3>
            </div>
            <p className="panel-desc">Manually trigger an AI-generated re-engagement message for the mock user.</p>
            <div className="trigger-form">
              <div className="form-group">
                <label>Product</label>
                <select value={selectedProduct} onChange={e => setSelectedProduct(Number(e.target.value))}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Trigger Type</label>
                <select value={triggerType} onChange={e => setTriggerType(e.target.value)}>
                  <option value="view_no_cart">Viewed but not added to cart</option>
                  <option value="cart_no_checkout">In cart but not checked out</option>
                </select>
              </div>
              <button className="btn btn-primary trigger-btn" onClick={handleTrigger} disabled={triggerLoading}>
                {triggerLoading
                  ? <><span className="loading-spinner" /> Generating...</>
                  : <><Zap size={16} /> Trigger AI Message</>
                }
              </button>
            </div>
          </div>

          {/* Intent Distribution */}
          <div className="card intent-panel">
            <div className="panel-header">
              <TrendingUp size={18} />
              <h3>Intent Distribution</h3>
            </div>
            {Object.keys(stats?.messages_by_intent || {}).length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Brain size={36} />
                <p>No intents detected yet.<br/>Try the chat assistant!</p>
              </div>
            ) : (
              <div className="intent-dist">
                {Object.entries(stats?.messages_by_intent || {}).map(([intent, count]) => {
                  const cfg = INTENT_COLORS[intent] || INTENT_COLORS.unknown
                  const total = Object.values(stats.messages_by_intent).reduce((a, b) => a + b, 0)
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={intent} className="intent-row">
                      <div className="intent-info">
                        <span style={{ background: cfg.bg, color: cfg.text }} className="intent-badge-dash">{cfg.label}</span>
                        <span className="intent-count">{count}</span>
                      </div>
                      <div className="intent-bar-wrap">
                        <div className="intent-bar" style={{ width: `${pct}%`, background: cfg.text }} />
                      </div>
                      <span className="intent-pct">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="card recent-panel full-width">
            <div className="panel-header">
              <MessageCircle size={18} />
              <h3>Recent Messages</h3>
            </div>
            <div className="messages-list">
              {(stats?.recent_messages || []).slice(0, 6).map(m => (
                <div key={m.id} className="message-row">
                  <div className={`msg-type-badge ${m.message_type}`}>
                    {m.message_type === 'outbound' ? <Send size={12} /> : <MessageCircle size={12} />}
                  </div>
                  <div className="msg-content">
                    <p>{m.message_text}</p>
                    <div className="msg-meta">
                      {m.trigger && <span className="tag tag-gray" style={{fontSize:'0.7rem'}}>{m.trigger}</span>}
                      {m.intent && (
                        <span style={{
                          background: INTENT_COLORS[m.intent]?.bg,
                          color: INTENT_COLORS[m.intent]?.text,
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600
                        }}>{INTENT_COLORS[m.intent]?.label}</span>
                      )}
                      <span className="msg-time"><Clock size={10}/>{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                  <span className={`msg-status ${m.status}`}>{m.status}</span>
                </div>
              ))}
              {(stats?.recent_messages || []).length === 0 && (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <MessageCircle size={36} />
                  <p>No messages yet. Trigger one above!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card users-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Phone</th><th>Cart Items</th><th>Messages</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className="tag tag-blue">{u.cart_items}</span></td>
                  <td><span className="tag tag-purple">{u.messages_sent}</span></td>
                  <td className="muted">{formatTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'messages' && (
        <MessagesTab pushNotification={pushNotification} />
      )}

      {activeTab === 'activities' && (
        <ActivitiesTab />
      )}
    </div>
  )
}

function MessagesTab() {
  const [msgs, setMsgs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Admin.messages().then(setMsgs).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="dashboard-loading"><div className="loading-spinner"/></div>

  return (
    <div className="card messages-table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Type</th><th>Message</th><th>Trigger</th><th>Intent</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          {msgs.map(m => (
            <tr key={m.id}>
              <td>
                <span className={`tag ${m.message_type === 'outbound' ? 'tag-purple' : 'tag-blue'}`}>
                  {m.message_type}
                </span>
              </td>
              <td style={{maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m.message_text}</td>
              <td>{m.trigger ? <span className="tag tag-gray">{m.trigger}</span> : '—'}</td>
              <td>{m.intent
                ? <span style={{background: INTENT_COLORS[m.intent]?.bg, color: INTENT_COLORS[m.intent]?.text, fontSize:'0.72rem', padding:'2px 8px', borderRadius:99, fontWeight:600}}>{m.intent}</span>
                : '—'}
              </td>
              <td><span className={`tag ${m.status === 'sent' ? 'tag-green' : 'tag-gray'}`}>{m.status}</span></td>
              <td className="muted">{formatTime(m.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivitiesTab() {
  const [acts, setActs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Admin.activities().then(setActs).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="dashboard-loading"><div className="loading-spinner"/></div>

  return (
    <div className="card activities-table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Action</th><th>Product ID</th><th>Metadata</th><th>Time</th></tr>
        </thead>
        <tbody>
          {acts.map(a => (
            <tr key={a.id}>
              <td>
                <span className="action-cell">
                  {ACTION_ICONS[a.action] || <Activity size={13}/>}
                  {a.action.replace(/_/g,' ')}
                </span>
              </td>
              <td>{a.product_id ?? '—'}</td>
              <td>{a.metadata ?? '—'}</td>
              <td className="muted">{formatTime(a.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
