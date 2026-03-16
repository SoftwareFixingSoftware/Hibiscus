import api from './api';

const BASE_PATH = '/secure/mpesa';

const MpesaService = {
  /**
   * Initiates an M‑Pesa STK push for a coin purchase.
   * @param {string} packageId - UUID of the coin package.
   * @param {string} idempotencyKey - Unique key to prevent duplicate requests.
   * @param {string} phoneNumber - Customer's phone number in format 2547XXXXXXXX.
   * @returns {Promise<Object>} Response containing checkoutRequestId and other details.
   */
  initiateCoinPurchase: async (packageId, idempotencyKey, phoneNumber) => {
    if (!packageId || !idempotencyKey || !phoneNumber) {
      throw new Error('packageId, idempotencyKey, and phoneNumber are required');
    }
    const response = await api.post(`${BASE_PATH}/coin-purchases`, {
      packageId,
      idempotencyKey,
      phoneNumber,
    });
    return response.data;
  },

 };

export default MpesaService;