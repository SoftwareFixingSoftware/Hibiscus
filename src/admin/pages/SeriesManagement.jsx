import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from 'react-icons/fi';
import SeriesModal from '../components/SeriesModal';
import SeriesService from '../services/SeriesService';

const SeriesManagement = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [filters, setFilters] = useState({
    activeOnly: null,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });

  useEffect(() => {
    fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, searchTerm]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      
      let response;
      if (searchTerm) {
        response = await SeriesService.searchSeries(searchTerm, {
          page,
          size: 10
        });
      } else {
        response = await SeriesService.getAllSeries({
          page,
          size: 10,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
          activeOnly: filters.activeOnly
        });
      }

      const content = response.content || response;
      setSeries(content);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || content.length || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching series:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSeries();
  };

  const handleCreate = () => {
    setSelectedSeries(null);
    setShowModal(true);
  };

  const handleEdit = (seriesItem) => {
    setSelectedSeries(seriesItem);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this series?')) return;
    
    try {
      await SeriesService.deleteSeries(id);
      fetchSeries();
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series');
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/series/${id}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSeries(null);
  };

  const handleModalSubmit = () => {
    handleModalClose();
    fetchSeries();
  };

  const getStatusBadge = (isPublished) => {
    return isPublished ? 'active' : 'draft';
  };

  const paginationButtons = [];
  const maxButtons = 5;
  let startPage = Math.max(0, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);
  
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setPage(i)}
        className={`pagination-btn ${page === i ? 'active' : ''}`}
      >
        {i + 1}
      </button>
    );
  }

  if (loading && page === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading series...</p>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-left">
          <h2 className="page-title">Series Management</h2>
          <p className="page-subtitle">Manage podcast series and their content</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={handleCreate}>
            <FiPlus />
            <span>Add New Series</span>
          </button>
        </div>
      </div>

      <div className="filters-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search series by title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </div>
        </form>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">
              <FiFilter />
              <span>Status</span>
            </label>
            <select
              value={filters.activeOnly === null ? 'all' : filters.activeOnly ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  activeOnly: value === 'all' ? null : value === 'active'
                });
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({...filters, sortBy: e.target.value});
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="updatedAt">Updated Date</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Order</label>
            <select
              value={filters.sortDirection}
              onChange={(e) => {
                setFilters({...filters, sortDirection: e.target.value});
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Episodes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {series.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">📺</div>
                    <h3>No series found</h3>
                    <p>Get started by creating your first series</p>
                    <button className="btn-primary" onClick={handleCreate}>
                      Create Series
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              series.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="series-title-cell">
                      <div className="series-cover">
                        {item.coverImageUrl ? (
                          <img src={item.coverImageUrl} alt={item.title} />
                        ) : (
                          <div className="series-cover-placeholder">
                            {item.title ? item.title.charAt(0) : '?'}
                          </div>
                        )}
                      </div>
                      <div className="series-info">
                        <h4 className="series-name">{item.title}</h4>
                        <p className="series-category">{item.category}</p>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`status-badge ${getStatusBadge(item.isPublished)}`}>
                      {item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td>
                    <div className="episode-count">
                      <span className="count">{item.episodeCount || 0}</span>
                      <span className="label">episodes</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <div className="date">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</div>
                      <div className="time">{item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view"
                        onClick={() => handleViewDetails(item.id)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {series.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalElements)} of {totalElements} series
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-nav"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <FiChevronsLeft />
            </button>
            <button 
              className="pagination-nav"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              <FiChevronLeft />
            </button>
            
            <div className="pagination-numbers">
              {paginationButtons}
            </div>
            
            <button 
              className="pagination-nav"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <FiChevronRight />
            </button>
            <button 
              className="pagination-nav"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <SeriesModal
          series={selectedSeries}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default SeriesManagement;
