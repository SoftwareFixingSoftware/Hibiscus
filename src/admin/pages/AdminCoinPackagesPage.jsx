import React, { useState, useEffect } from 'react';
import CoinPackageService from '../services/CoinPackageService';
import CountryService from '../services/CountryService';

// Modal component (simple overlay)
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const AdminCoinPackagesPage = () => {
  // ---------- Tab State ----------
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'countries'

  // ---------- Packages State ----------
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState('');

  // ---------- Countries State ----------
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState('');

  // ---------- Modal State ----------
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // ---------- Form State (for modals) ----------
  const [packageForm, setPackageForm] = useState({
    sku: '',
    name: '',
    description: '',
    coinsAmount: '',
    priceCents: '',
    currency: 'USD',
    isActive: true,
  });
  const [countryForm, setCountryForm] = useState({
    countryCode: '',
    name: '',
  });

  // ---------- Form Submission Loading ----------
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const [submittingCountry, setSubmittingCountry] = useState(false);
  const [packageSubmitMessage, setPackageSubmitMessage] = useState({ type: '', text: '' });
  const [countrySubmitMessage, setCountrySubmitMessage] = useState({ type: '', text: '' });

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'packages') {
      fetchPackages();
    } else {
      fetchCountries();
    }
  }, [activeTab]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    setPackagesError('');
    try {
      const response = await CoinPackageService.getAllPackages();
      console.log('Packages API response:', response); // Debug log

      // Extract the actual array from the response
      let packagesData;

      // Case 1: response is the full Axios response with data property
      if (response && typeof response === 'object' && 'data' in response) {
        packagesData = response.data;
      }
      // Case 2: response itself is the array (if service returns data directly)
      else if (Array.isArray(response)) {
        packagesData = response;
      }
      // Case 3: response might be wrapped in another object (e.g., { data: [...] })
      else if (response && response.data && Array.isArray(response.data)) {
        packagesData = response.data;
      }
      // Case 4: response.data might itself have a data property (rare)
      else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        console.warn('Deeply nested data structure:', response.data);
        packagesData = response.data.data;
      }
      else {
        packagesData = [];
      }

      // Ensure we always set an array
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      setPackagesError('Failed to load packages.');
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchCountries = async () => {
    setLoadingCountries(true);
    setCountriesError('');
    try {
      const response = await CountryService.getAllCountries();
      console.log('Countries API response:', response); // Debug log

      let countriesData;
      if (response && typeof response === 'object' && 'data' in response) {
        countriesData = response.data;
      } else if (Array.isArray(response)) {
        countriesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        countriesData = response.data;
      } else {
        countriesData = [];
      }

      setCountries(Array.isArray(countriesData) ? countriesData : []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setCountriesError('Failed to load countries.');
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // ---------- Package Form Handlers ----------
  const handlePackageChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPackageForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetPackageForm = () => {
    setPackageForm({
      sku: '',
      name: '',
      description: '',
      coinsAmount: '',
      priceCents: '',
      currency: 'USD',
      isActive: true,
    });
    setPackageSubmitMessage({ type: '', text: '' });
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPackage(true);
    setPackageSubmitMessage({ type: '', text: '' });

    const payload = {
      ...packageForm,
      coinsAmount: parseInt(packageForm.coinsAmount, 10),
      priceCents: parseInt(packageForm.priceCents, 10),
    };

    try {
      await CoinPackageService.createPackage(payload);
      setPackageSubmitMessage({ type: 'success', text: 'Package created successfully!' });
      // Refresh list after a short delay, then close modal
      setTimeout(() => {
        fetchPackages();
        setIsPackageModalOpen(false);
        resetPackageForm();
      }, 1000);
    } catch (error) {
      console.error('Package creation failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create package.';
      setPackageSubmitMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmittingPackage(false);
    }
  };

  // ---------- Country Form Handlers ----------
  const handleCountryChange = (e) => {
    const { name, value } = e.target;
    setCountryForm((prev) => ({
      ...prev,
      [name]: name === 'countryCode' ? value.toUpperCase() : value,
    }));
  };

  const resetCountryForm = () => {
    setCountryForm({ countryCode: '', name: '' });
    setCountrySubmitMessage({ type: '', text: '' });
  };

  const handleCountrySubmit = async (e) => {
    e.preventDefault();
    setSubmittingCountry(true);
    setCountrySubmitMessage({ type: '', text: '' });

    try {
      await CountryService.createCountry(countryForm);
      setCountrySubmitMessage({ type: 'success', text: 'Country added successfully!' });
      setTimeout(() => {
        fetchCountries();
        setIsCountryModalOpen(false);
        resetCountryForm();
      }, 1000);
    } catch (error) {
      console.error('Country creation failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add country.';
      setCountrySubmitMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmittingCountry(false);
    }
  };

  // ---------- Render Functions ----------
  const renderPackagesTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Coin Packages</h2>
        <button className="btn-create" onClick={() => { resetPackageForm(); setIsPackageModalOpen(true); }}>
          + Create Package
        </button>
      </div>

      {loadingPackages && <p>Loading packages...</p>}
      {packagesError && <div className="message error">{packagesError}</div>}
      {!loadingPackages && !packagesError && (
        <>
          {packages.length === 0 ? (
            <p>No packages found.</p>
          ) : (
            <div className="list-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Coins</th>
                    <th>Price (cents)</th>
                    <th>Currency</th>
                    <th>Active</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.packageId}>
                      <td>{pkg.sku}</td>
                      <td>{pkg.name}</td>
                      <td>{pkg.coinsAmount}</td>
                      <td>{pkg.priceCents}</td>
                      <td>{pkg.currency}</td>
                      <td>{pkg.active ? 'Yes' : 'No'}</td>
                      <td>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Package Creation Modal */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Create Coin Package">
        <form onSubmit={handlePackageSubmit}>
          <div className="form-group">
            <label htmlFor="modal-sku">SKU *</label>
            <input
              type="text"
              id="modal-sku"
              name="sku"
              value={packageForm.sku}
              onChange={handlePackageChange}
              required
              maxLength="100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="modal-name">Name *</label>
            <input
              type="text"
              id="modal-name"
              name="name"
              value={packageForm.name}
              onChange={handlePackageChange}
              required
              maxLength="255"
            />
          </div>
          <div className="form-group">
            <label htmlFor="modal-description">Description</label>
            <textarea
              id="modal-description"
              name="description"
              value={packageForm.description}
              onChange={handlePackageChange}
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-coinsAmount">Coins Amount *</label>
              <input
                type="number"
                id="modal-coinsAmount"
                name="coinsAmount"
                value={packageForm.coinsAmount}
                onChange={handlePackageChange}
                required
                min="1"
                step="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-priceCents">Price (cents) *</label>
              <input
                type="number"
                id="modal-priceCents"
                name="priceCents"
                value={packageForm.priceCents}
                onChange={handlePackageChange}
                required
                min="1"
                step="1"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-currency">Currency</label>
              <select
                id="modal-currency"
                name="currency"
                value={packageForm.currency}
                onChange={handlePackageChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={packageForm.isActive}
                  onChange={handlePackageChange}
                />
                Active
              </label>
            </div>
          </div>

          {packageSubmitMessage.text && (
            <div className={`message ${packageSubmitMessage.type}`}>
              {packageSubmitMessage.text}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsPackageModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submittingPackage}>
              {submittingPackage ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderCountriesTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Allowed Countries</h2>
        <button className="btn-create" onClick={() => { resetCountryForm(); setIsCountryModalOpen(true); }}>
          + Add Country
        </button>
      </div>

      {loadingCountries && <p>Loading countries...</p>}
      {countriesError && <div className="message error">{countriesError}</div>}
      {!loadingCountries && !countriesError && (
        <>
          {countries.length === 0 ? (
            <p>No countries found.</p>
          ) : (
            <div className="list-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country.countryCode}>
                      <td><span className="country-code">{country.countryCode}</span></td>
                      <td>{country.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Country Creation Modal */}
      <Modal isOpen={isCountryModalOpen} onClose={() => setIsCountryModalOpen(false)} title="Add Allowed Country">
        <form onSubmit={handleCountrySubmit}>
          <div className="form-group">
            <label htmlFor="modal-countryCode">Country Code (2 letters) *</label>
            <input
              type="text"
              id="modal-countryCode"
              name="countryCode"
              value={countryForm.countryCode}
              onChange={handleCountryChange}
              required
              minLength="2"
              maxLength="2"
              pattern="[A-Za-z]{2}"
              title="Two-letter country code (e.g., US, GB)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="modal-countryName">Country Name *</label>
            <input
              type="text"
              id="modal-countryName"
              name="name"
              value={countryForm.name}
              onChange={handleCountryChange}
              required
              maxLength="100"
            />
          </div>

          {countrySubmitMessage.text && (
            <div className={`message ${countrySubmitMessage.type}`}>
              {countrySubmitMessage.text}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsCountryModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submittingCountry}>
              {submittingCountry ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  return (
    <div className="admin-packages-container">
      <h1>Admin: Coin Packages & Countries</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          Packages
        </button>
        <button
          className={`tab ${activeTab === 'countries' ? 'active' : ''}`}
          onClick={() => setActiveTab('countries')}
        >
          Countries
        </button>
      </div>

      {activeTab === 'packages' ? renderPackagesTab() : renderCountriesTab()}
    </div>
  );
};

export default AdminCoinPackagesPage;