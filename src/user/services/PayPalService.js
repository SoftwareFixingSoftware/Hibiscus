import api from './api';

const BASE_PATH = '/secure/payments';

const PayPalService = {
  getCoinPackages: async () => {
    const response = await api.get(`${BASE_PATH}/coin-packages`);
    return response.data;
  },

  createCoinPurchase: async (packageId, idempotencyKey) => {
    if (!packageId || !idempotencyKey) {
      throw new Error('packageId and idempotencyKey are required');
    }
    const response = await api.post(`${BASE_PATH}/coin-purchases`, {
      packageId,
      idempotencyKey,
    });
    const { approvalUrl, paypalOrderId } = response.data;
    // Store order ID in sessionStorage before redirect
    if (paypalOrderId) {
      sessionStorage.setItem('pendingPaypalOrder', paypalOrderId);
    }
    return { approvalUrl, paypalOrderId };
  },

  cancelCoinPurchase: async (paypalOrderId) => {
    if (!paypalOrderId) {
      throw new Error('paypalOrderId is required');
    }
    await api.post(`${BASE_PATH}/coin-purchases/cancel`, { paypalOrderId });
    sessionStorage.removeItem('pendingPaypalOrder');
  },

  getUserCoins: async () => {
    const response = await api.get(`${BASE_PATH}/coins`);
    return response.data;
  },

  getUserCoinPurchaseHistory: async () => {
    const response = await api.get(`${BASE_PATH}/coin-purchases/history`);
    return response.data;
  },
};

export default PayPalService;