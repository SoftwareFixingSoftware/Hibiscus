import React from 'react';
import RippleButton from '../common/RippleButton';

const SearchBar = ({ searchQuery, onSearchChange, onSearchSubmit, onClear, mode }) => {
  return (
    <div className="search-sort-bar">
      <input
        type="text"
        placeholder="Search series..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
        className="search-input"
      />
      {mode === 'search' && (
        <RippleButton className="ctrl" onClick={onClear} style={{ padding: '12px 20px' }}>
          ✕ Clear
        </RippleButton>
      )}
    </div>
  );
};

export default SearchBar;