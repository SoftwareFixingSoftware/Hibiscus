import api from './api';

const CountryService = {
  /**
   * Create a new country (admin only)
   * @param {Object} countryData - { countryCode, name }
   * @returns {Promise}
   */
  createCountry: (countryData) => {
     return api.post('/secure/countries', countryData);
  },

  /**
   * Get all countries (public)
   * @returns {Promise}
   */
  getAllCountries: async () => {
    const response = await api.get('/secure/countries');
     return response;
  },

  // Additional methods if needed
};

export default CountryService;