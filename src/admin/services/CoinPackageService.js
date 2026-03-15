import api from './api';

const CoinPackageService = {
  /**
   * Create a new coin package
   * @param {Object} packageData - { sku, name, description, coinsAmount, priceCents, currency, isActive }
   * @returns {Promise}
   */
  createPackage: (packageData) => {
     // If api.js already prefixes with /api, just use '/secure/packages'
    return api.post('/secure/packages', packageData);
  },

  /**
   * Get all coin packages (list)
   * Assumes backend provides GET /api/secure/packages (or similar)
   * @returns {Promise}
   */
  getAllPackages: async () => {
     const response = await api.get('/secure/packages');
    return response;
  },

  // Add update/delete methods as needed
};

export default CoinPackageService;