import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import ProgressView from './components/ProgressView';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [userProfile, setUserProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, history, progress, pockets

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial Load
  useEffect(() => {
    const savedProfile = localStorage.getItem('upocket_profile');
    const savedExpenses = localStorage.getItem('upocket_expenses');
    const savedTheme = localStorage.getItem('upocket_theme');

    if (savedTheme) setTheme(savedTheme);

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
      setCurrentView('main');
    } else {
      setCurrentView('onboarding');
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('upocket_theme', newTheme);
  };

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile);
    localStorage.setItem('upocket_profile', JSON.stringify(profile));
    setCurrentView('main');
  };

  const handleAddExpense = (expense) => {
    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    localStorage.setItem('upocket_expenses', JSON.stringify(updatedExpenses));
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (currentView === 'loading') {
    return (
      <div className="flex justify-center align-center" style={{height: '100vh'}}>
        <h2 className="text-accent animate-fade-in">Cargando U-Pocket...</h2>
      </div>
    );
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          userProfile={userProfile} 
          addExpense={handleAddExpense} 
          totalExpenses={totalExpenses} 
          history={expenses}
          changeTheme={changeTheme}
        />;
      case 'history':
        return <HistoryView history={expenses} />;
      case 'progress':
        return <ProgressView history={expenses} onBack={() => setActiveTab('dashboard')} />;
      case 'pockets':
        return <div className="p-6 text-center text-muted">Bolsillos de ahorro (Próximamente)</div>;
      default:
        return null;
    }
  };

  // Check if desktop
  const isDesktop = window.innerWidth >= 768;

  return (
    <>
      <div className={isDesktop ? "app-container" : "app-container-mobile"}>
        
        {/* Sidebar (Only Desktop) */}
        {isDesktop && (
          <aside className="sidebar">
            <div className="px-6 mb-6" style={{ padding: '0 24px' }}>
              <h2 className="text-accent" style={{ fontSize: '24px' }}>U-Pocket</h2>
              <p className="text-muted tabular-nums" style={{ fontSize: '12px', marginTop: '4px' }}>Financial Wellness</p>
            </div>

            <nav className="flex flex-col gap-2" style={{ padding: '0 16px' }}>
              <button className={`btn btn-ghost ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                🏠 Dashboard Principal
              </button>
              <button className={`btn btn-ghost ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                📋 Historial de Gastos
              </button>
              <button className={`btn btn-ghost ${activeTab === 'pockets' ? 'active' : ''}`} onClick={() => setActiveTab('pockets')}>
                💰 Bolsillos de Ahorro
              </button>
              <button className={`btn btn-ghost ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
                📊 Estadísticas y Avances
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={isDesktop ? "main-content" : "main-content-mobile"}>
          {renderContent()}
        </main>
      </div>

      {/* Bottom Navigation (Only Mobile) */}
      <div className="bottom-nav">
        <button 
          className="btn" 
          style={{ background: 'transparent', color: activeTab === 'dashboard' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          onClick={() => setActiveTab('dashboard')}
        >
          <span style={{ fontSize: '24px' }}>🏠</span>
        </button>
        <button 
          className="btn" 
          style={{ background: 'transparent', color: activeTab === 'history' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          onClick={() => setActiveTab('history')}
        >
          <span style={{ fontSize: '24px' }}>📋</span>
        </button>
        <button 
          className="btn" 
          style={{ background: 'transparent', color: activeTab === 'pockets' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          onClick={() => setActiveTab('pockets')}
        >
          <span style={{ fontSize: '24px' }}>💰</span>
        </button>
        <button 
          className="btn" 
          style={{ background: 'transparent', color: activeTab === 'progress' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          onClick={() => setActiveTab('progress')}
        >
          <span style={{ fontSize: '24px' }}>📊</span>
        </button>
      </div>
    </>
  );
}

export default App;
