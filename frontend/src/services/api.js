import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

const USER_ID = 1

export const Products = {
  getAll: () => api.get('/products/').then(r => r.data),
  getOne: (id) => api.get(`/products/${id}`).then(r => r.data),
}

export const Cart = {
  get: () => api.get(`/cart/${USER_ID}`).then(r => r.data),
  add: (product_id, quantity = 1) =>
    api.post('/cart/add', { user_id: USER_ID, product_id, quantity }).then(r => r.data),
  remove: (cart_id) => api.delete(`/cart/remove/${cart_id}`).then(r => r.data),
  checkout: () => api.post(`/cart/checkout/${USER_ID}`).then(r => r.data),
}

export const Activity = {
  track: (action, product_id = null, metadata = null) =>
    api.post('/activity/track', { user_id: USER_ID, action, product_id, metadata }).then(r => r.data),
  getAll: () => api.get(`/activity/${USER_ID}`).then(r => r.data),
}

export const Messages = {
  trigger: (trigger_type, product_id) =>
    api.post('/messages/trigger', { user_id: USER_ID, trigger_type, product_id }).then(r => r.data),
  reply: (reply_text) =>
    api.post('/messages/reply', { user_id: USER_ID, reply_text }).then(r => r.data),
  getAll: () => api.get(`/messages/${USER_ID}`).then(r => r.data),
}

export const Admin = {
  stats: () => api.get('/admin/stats').then(r => r.data),
  users: () => api.get('/admin/users').then(r => r.data),
  messages: () => api.get('/admin/messages').then(r => r.data),
  activities: () => api.get('/admin/activities').then(r => r.data),
}

export default api
