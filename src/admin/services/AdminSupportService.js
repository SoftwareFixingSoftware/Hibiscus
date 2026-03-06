// src/services/AdminSupportService.js
import api from './api';

const BASE_PATH = '/secure/admin/support';

// Helper to add the admin flag header from localStorage
const withAdminHeader = (config = {}) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true'; // adjust key as needed
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-User-Is-Admin': isAdmin ? 'true' : 'false'
    }
  };
};

const normalizeTicket = (tRaw) => {
  if (!tRaw) return null;
  return {
    ticketId: tRaw.ticketId || tRaw.ticket_id,
    subject: tRaw.subject,
    description: tRaw.description,
    status: tRaw.status,
    priority: tRaw.priority,
    paymentId: tRaw.paymentId || tRaw.payment_id,
    coinPurchaseId: tRaw.coinPurchaseId || tRaw.coin_purchase_id,
    amountCents: tRaw.amountCents,
    currency: tRaw.currency || 'USD',
    coinsAmount: tRaw.coinsAmount,
    assignedAdminId: tRaw.assignedAdminId,
    userId: tRaw.userId || tRaw.user_id,
    contactEmail: tRaw.contactEmail || tRaw.contact_email,
    createdAt: tRaw.createdAt || tRaw.created_at,
    updatedAt: tRaw.updatedAt || tRaw.updated_at,
    lastActivityAt: tRaw.lastActivityAt || tRaw.last_activity_at,
    txId: tRaw.txId || tRaw.tx_id,
    episodePurchaseId: tRaw.episodePurchaseId || tRaw.episode_purchase_id,
    messages: Array.isArray(tRaw.messages)
      ? tRaw.messages.map(m => ({
          messageId: m.messageId || m.message_id,
          responderUserId: m.responderUserId || m.responder_user_id,
          internal: !!m.internal,
          body: m.body,
          attachments: m.attachments,
          createdAt: m.createdAt || m.created_at
        }))
      : []
  };
};

const AdminSupportService = {
  /**
   * GET /api/secure/admin/support/tickets?status=OPEN
   * Returns all tickets (optionally filtered by status)
   */
  listTickets: async (status = null) => {
    const params = status ? { status } : {};
    const data = await api.get(`${BASE_PATH}/tickets`, withAdminHeader({ params }));
    if (!data) return [];
    // normalize each ticket
    return Array.isArray(data)
      ? data.map(normalizeTicket)
      : [normalizeTicket(data)];
  },

  /**
   * GET /api/secure/admin/support/tickets/{ticketId}
   */
  getTicket: async (ticketId) => {
    const data = await api.get(`${BASE_PATH}/tickets/${ticketId}`, withAdminHeader());
    if (!data) return null;
    // If API returns array instead of object
    const ticketData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    return normalizeTicket(ticketData);
  },

  /**
   * PUT /api/secure/admin/support/tickets/{ticketId}/assign
   * body: { assignToAdminId: 'uuid' }
   */
  assignTicket: async (ticketId, assignToAdminId) => {
    const data = await api.put(`${BASE_PATH}/tickets/${ticketId}/assign`, { assignToAdminId }, withAdminHeader());
    return normalizeTicket(data);
  },

  /**
   * PUT /api/secure/admin/support/tickets/{ticketId}/status
   * body: { status: "RESOLVED" }
   */
  updateStatus: async (ticketId, status) => {
    const data = await api.put(`${BASE_PATH}/tickets/${ticketId}/status`, { status }, withAdminHeader());
    return normalizeTicket(data);
  },

  /**
   * POST /api/secure/admin/support/tickets/{ticketId}/notes
   * body: { body, attachments } internal note
   */
  addInternalNote: async (ticketId, { body, attachments = null } = {}) => {
    const data = await api.post(`${BASE_PATH}/tickets/${ticketId}/notes`, { body, attachments }, withAdminHeader());
    return normalizeTicket(data);
  },

  /**
   * Admin public reply: use normal user message endpoint but internal=false
   * POST /api/secure/support/tickets/{ticketId}/messages
   */
  replyToTicket: async (ticketId, { body, attachments = null } = {}) => {
    const data = await api.post(`/secure/support/tickets/${ticketId}/messages`, { body, attachments, internal: false }, withAdminHeader());
    return normalizeTicket(data);
  }
};

export default AdminSupportService;