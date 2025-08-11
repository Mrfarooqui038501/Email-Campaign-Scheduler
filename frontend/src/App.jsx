import React, { useState } from 'react';
import CampaignForm from './components/CampaignForm';
import CampaignList from './components/CampaignList';
import './app.css';

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const toggleDarkMode = () => {
    setDarkMode((d) => {
      localStorage.setItem("darkMode", (!d).toString());
      return !d;
    });
  };

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <header className="top-bar">
        <h1>Email Campaign Manager</h1>
        <button className="dark-toggle-btn" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>
      <main className="main-content-container">
        <div className="component-wrapper">
          <CampaignForm />
        </div>
        <div className="component-wrapper campaign-list-wrapper">
          <CampaignList />
        </div>
      </main>
    </div>
  );
}
export default App;
