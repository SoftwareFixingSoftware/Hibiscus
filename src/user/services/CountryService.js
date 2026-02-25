import api from './api';

const BASE_PATH = '/secure/countries';

const CountryService = {
  // GET /api/secure/countries
  getAllCountries: async () => {
    const response = await api.get(`${BASE_PATH}`);
    return response.data;
  }
};

export default CountryService;