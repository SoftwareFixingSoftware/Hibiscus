import React, { useState, useEffect } from 'react';
import CoinPackageService from '../services/CoinPackageService';
import CountryService from '../services/CountryService';
import '../styles/admin-packages.css'; // will use global classes


const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">{title}</h3>
          <button className="adm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="adm-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const AdminCoinPackagesPage = () => {
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState('');
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState('');
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    sku: '', name: '', description: '', coinsAmount: '', priceCents: '', currency: 'USD', isActive: true,
  });
  const [countryForm, setCountryForm] = useState({ countryCode: '', name: '' });
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const [submittingCountry, setSubmittingCountry] = useState(false);
  const [packageSubmitMessage, setPackageSubmitMessage] = useState({ type: '', text: '' });
  const [countrySubmitMessage, setCountrySubmitMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'packages') fetchPackages();
    else fetchCountries();
  }, [activeTab]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    setPackagesError('');
    try {
      const response = await CoinPackageService.getAllPackages();
      let packagesData;
      if (response && typeof response === 'object' && 'data' in response) packagesData = response.data;
      else if (Array.isArray(response)) packagesData = response;
      else if (response && response.data && Array.isArray(response.data)) packagesData = response.data;
      else packagesData = [];
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (error) {
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
      let countriesData;
      if (response && typeof response === 'object' && 'data' in response) countriesData = response.data;
      else if (Array.isArray(response)) countriesData = response;
      else if (response && response.data && Array.isArray(response.data)) countriesData = response.data;
      else countriesData = [];
      setCountries(Array.isArray(countriesData) ? countriesData : []);
    } catch (error) {
      setCountriesError('Failed to load countries.');
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  const handlePackageChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPackageForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const resetPackageForm = () => {
    setPackageForm({ sku: '', name: '', description: '', coinsAmount: '', priceCents: '', currency: 'USD', isActive: true });
    setPackageSubmitMessage({ type: '', text: '' });
  };
  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPackage(true);
    setPackageSubmitMessage({ type: '', text: '' });
    const payload = { ...packageForm, coinsAmount: parseInt(packageForm.coinsAmount, 10), priceCents: parseInt(packageForm.priceCents, 10) };
    try {
      await CoinPackageService.createPackage(payload);
      setPackageSubmitMessage({ type: 'success', text: 'Package created successfully!' });
      setTimeout(() => {
        fetchPackages();
        setIsPackageModalOpen(false);
        resetPackageForm();
      }, 1000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create package.';
      setPackageSubmitMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmittingPackage(false);
    }
  };

  const handleCountryChange = (e) => {
    const { name, value } = e.target;
    setCountryForm(prev => ({ ...prev, [name]: name === 'countryCode' ? value.toUpperCase() : value }));
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
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add country.';
      setCountrySubmitMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmittingCountry(false);
    }
  };

  const renderPackagesTab = () => (
    <div className="adm-tab-content">
      <div className="adm-tab-header">
        <h2>Coin Packages</h2>
        <button className="adm-btn-create" onClick={() => { resetPackageForm(); setIsPackageModalOpen(true); }}>
          + Create Package
        </button>
      </div>
      {loadingPackages && <p>Loading packages...</p>}
      {packagesError && <div className="adm-alert adm-error">{packagesError}</div>}
      {!loadingPackages && !packagesError && (
        <>
          {packages.length === 0 ? <p>No packages found.</p> : (
            <div className="adm-list-container">
              <table className="adm-data-table">
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
                  {packages.map(pkg => (
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
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Create Coin Package">
        <form onSubmit={handlePackageSubmit} className="adm-modal-form">
          <div className="adm-form-group">
            <label htmlFor="modal-sku">SKU *</label>
            <input type="text" id="modal-sku" name="sku" value={packageForm.sku} onChange={handlePackageChange} required maxLength="100" className="adm-form-input" />
          </div>
          <div className="adm-form-group">
            <label htmlFor="modal-name">Name *</label>
            <input type="text" id="modal-name" name="name" value={packageForm.name} onChange={handlePackageChange} required maxLength="255" className="adm-form-input" />
          </div>
          <div className="adm-form-group">
            <label htmlFor="modal-description">Description</label>
            <textarea id="modal-description" name="description" value={packageForm.description} onChange={handlePackageChange} rows="3" className="adm-form-textarea" />
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label htmlFor="modal-coinsAmount">Coins Amount *</label>
              <input type="number" id="modal-coinsAmount" name="coinsAmount" value={packageForm.coinsAmount} onChange={handlePackageChange} required min="1" step="1" className="adm-form-input" />
            </div>
            <div className="adm-form-group">
              <label htmlFor="modal-priceCents">Price (cents) *</label>
              <input type="number" id="modal-priceCents" name="priceCents" value={packageForm.priceCents} onChange={handlePackageChange} required min="1" step="1" className="adm-form-input" />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label htmlFor="modal-currency">Currency</label>
              <select id="modal-currency" name="currency" value={packageForm.currency} onChange={handlePackageChange} className="adm-form-select">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="adm-form-group adm-checkbox">
              <label className="adm-checkbox-label">
                <input type="checkbox" name="isActive" checked={packageForm.isActive} onChange={handlePackageChange} className="adm-checkbox" />
                Active
              </label>
            </div>
          </div>
          {packageSubmitMessage.text && (
            <div className={`adm-alert ${packageSubmitMessage.type === 'success' ? 'adm-success' : 'adm-error'}`}>
              {packageSubmitMessage.text}
            </div>
          )}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={() => setIsPackageModalOpen(false)}>Cancel</button>
            <button type="submit" className="adm-btn-primary" disabled={submittingPackage}>
              {submittingPackage ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderCountriesTab = () => (
    <div className="adm-tab-content">
      <div className="adm-tab-header">
        <h2>Allowed Countries</h2>
        <button className="adm-btn-create" onClick={() => { resetCountryForm(); setIsCountryModalOpen(true); }}>
          + Add Country
        </button>
      </div>
      {loadingCountries && <p>Loading countries...</p>}
      {countriesError && <div className="adm-alert adm-error">{countriesError}</div>}
      {!loadingCountries && !countriesError && (
        <>
          {countries.length === 0 ? <p>No countries found.</p> : (
            <div className="adm-list-container">
              <table className="adm-data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map(country => (
                    <tr key={country.countryCode}>
                      <td><span className="adm-country-code">{country.countryCode}</span></td>
                      <td>{country.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <Modal isOpen={isCountryModalOpen} onClose={() => setIsCountryModalOpen(false)} title="Add Allowed Country">
        <form onSubmit={handleCountrySubmit} className="adm-modal-form">
          <div className="adm-form-group">
            <label htmlFor="modal-countryCode">Country Code (2 letters) *</label>
            <input type="text" id="modal-countryCode" name="countryCode" value={countryForm.countryCode} onChange={handleCountryChange} required minLength="2" maxLength="2" pattern="[A-Za-z]{2}" title="Two-letter country code (e.g., US, GB)" className="adm-form-input" />
          </div>
          <div className="adm-form-group">
            <label htmlFor="modal-countryName">Country Name *</label>
            <input type="text" id="modal-countryName" name="name" value={countryForm.name} onChange={handleCountryChange} required maxLength="100" className="adm-form-input" />
          </div>
          {countrySubmitMessage.text && (
            <div className={`adm-alert ${countrySubmitMessage.type === 'success' ? 'adm-success' : 'adm-error'}`}>
              {countrySubmitMessage.text}
            </div>
          )}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={() => setIsCountryModalOpen(false)}>Cancel</button>
            <button type="submit" className="adm-btn-primary" disabled={submittingCountry}>
              {submittingCountry ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  return (
    <div className="adm-packages-container">
      <h1>Admin: Coin Packages & Countries</h1>
      <div className="adm-tabs">
        <button className={`adm-tab ${activeTab === 'packages' ? 'adm-active' : ''}`} onClick={() => setActiveTab('packages')}>
          Packages
        </button>
        <button className={`adm-tab ${activeTab === 'countries' ? 'adm-active' : ''}`} onClick={() => setActiveTab('countries')}>
          Countries
        </button>
      </div>
      {activeTab === 'packages' ? renderPackagesTab() : renderCountriesTab()}
    </div>
  );
};

export default AdminCoinPackagesPage;