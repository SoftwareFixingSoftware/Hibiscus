import React from 'react';
import RippleButton from '../common/RippleButton';
import { FaTimes } from 'react-icons/fa';

const SearchBar = ({ searchQuery, onSearchChange, onSearchSubmit, onClear, mode }) => {
  return (
    <div className="user-search-sort-bar">
      <input
        type="text"
        placeholder="Search series..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
        className="user-search-input"
      />
      {mode === 'search' && (
        <RippleButton className="user-ctrl" onClick={onClear} title="Clear search">
          <FaTimes />
        </RippleButton>
      )}
    </div>
  );
};

export default SearchBar;