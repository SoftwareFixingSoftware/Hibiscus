import api from './api';

const BASE_PATH = '/secure/support';

const SupportService = {
  /**
   * Create a support ticket.
   * - transaction: object from history (may include coinPurchaseId, paymentId, txId, amountCents, coinsAmount, currency, etc)
   * - message: string
   * - contactEmail (optional): will fall back to /secure/users/me if not provided
   *
   * Returns created ticket DTO from backend.
   */
  createTicket: async ({ transaction = {}, message = '', contactEmail = null }) => {
    let email = contactEmail;
    // attempt to fetch current user email if not supplied
    if (!email) {
      try {
        const me = await api.get('/secure/users/me'); // your existing users endpoint
        email = me.data?.email;
      } catch (err) {
        // ignore — we'll still send ticket with empty contactEmail if not found
      }
    }

    const payload = {
      contactEmail: email || '',
      subject: `Issue with transaction ${transaction.coinPurchaseId || transaction.paymentId || transaction.txId || 'unknown'}`,
      description: message,

      // optional links / snapshots (backend supports nulls)
      paymentId: transaction.paymentId || null,
      coinPurchaseId: transaction.coinPurchaseId || null,
      txId: transaction.txId || null,
      episodePurchaseId: transaction.episodePurchaseId || null,
      amountCents: (transaction.amountCents != null) ? transaction.amountCents : null,
      currency: transaction.currency || null,
      coinsAmount: (transaction.coinsAmount != null) ? transaction.coinsAmount : null
    };

    const resp = await api.post(`${BASE_PATH}/tickets`, payload);
    return resp.data;
  },

  // user endpoints
  listTickets: async () => {
    const resp = await api.get(`${BASE_PATH}/tickets`);
    return resp.data;
  },

  getTicket: async (ticketId) => {
    const resp = await api.get(`${BASE_PATH}/tickets/${ticketId}`);
    return resp.data;
  },

  addMessage: async (ticketId, { body, attachments = null, internal = false }) => {
    const payload = { body, attachments, internal };
    const resp = await api.post(`${BASE_PATH}/tickets/${ticketId}/messages`, payload);
    return resp.data;
  }
};

export default SupportService;