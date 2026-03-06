import api from './api';

const AdminPaymentService = {
  /**
   * Get paginated list of all payments (admin only)
   * @param {Object} params - { page, size, status, start, end }
   * @returns {Promise}
   */
  getPayments: (params = {}) => {
    return api.get('/secure/admin/payments', { params });
  },

  /**
   * Get payment statistics (admin only)
   * @returns {Promise}
   */
  getPaymentStatistics: () => {
    return api.get('/secure/admin/payments/statistics');
  },

  /**
   * Get a single payment by ID (admin only)
   * @param {string} paymentId
   * @returns {Promise}
   */
  getPayment: (paymentId) => {
    return api.get(`/secure/admin/payments/${paymentId}`);
  }
};

export default AdminPaymentService;