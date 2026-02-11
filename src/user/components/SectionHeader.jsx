import React from 'react';

const SectionHeader = ({ title, subtitle, linkText, linkUrl }) => {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {linkText && linkUrl && (
        <a href={linkUrl} className="view-all-link">
          {linkText} →
        </a>
      )}
    </div>
  );
};

export default SectionHeader;