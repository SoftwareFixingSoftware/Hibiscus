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
    return response.data;
  },

  getUserCoins: async () => {
    const response = await api.get(`${BASE_PATH}/coins`);
    return response.data;
  },

  // NEW: Get user's coin purchase history
  getUserCoinPurchaseHistory: async () => {
    const response = await api.get(`${BASE_PATH}/coin-purchases/history`);
    return response.data;
  },
};

export default PayPalService;