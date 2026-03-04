// components/Header.js
import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div>
        <h2>Dashboard</h2>
        <p>Welcome back! Here's your financial overview.</p>
      </div>
      <div className="header-actions">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search..." />
        </div>
        <button className="icon-btn">
          <i className="fas fa-bell"></i>
        </button>
        <button className="icon-btn">
          <i className="fas fa-question-circle"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;