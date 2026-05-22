import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import ProgressView from './components/ProgressView';
import PocketsView from './components/PocketsView';
import './index.css';

// Initial Mock Pockets for high-fidelity seeding
const DEFAULT_POCKETS = [
  { id: '1', name: 'Viaje a Japón', targetAmount: 5000, currentAmount: 3250, category: 'Lifestyle', date: 'Nov 2024', icon: 'flight_takeoff' },
  { id: '2', name: 'Fondo de Emergencia', targetAmount: 10000, currentAmount: 8900, category: 'Seguridad', date: 'Indefinido', icon: 'health_and_safety' },
  { id: '3', name: 'MacBook Pro M3', targetAmount: 2400, currentAmount: 450, category: 'Productividad', date: 'Dic 2024', icon: 'laptop_mac' },
  { id: '4', name: 'Enganche Casa', targetAmount: 150000, currentAmount: 45000, category: 'Futuro', date: 'Dic 2026', icon: 'home' },
  { id: '5', name: 'Mantenimiento Auto', targetAmount: 1500, currentAmount: 1200, category: 'Mantenimiento', date: 'Jul 2024', icon: 'directions_car' }
];

function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [userProfile, setUserProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pockets, setPockets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, history, pockets, progress
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [showTxModal, setShowTxModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  
  // Transaction Modal Form state
  const [txName, setTxName] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Fijos'); // Fijos, Hormiga, Ocio
  const [txDetails, setTxDetails] = useState('');

  // Funds Adjustment Form state
  const [adjInitialBalance, setAdjInitialBalance] = useState('');
  const [adjFixedExpenses, setAdjFixedExpenses] = useState('');

  // Theme Sync
  useEffect(() => {
    document.documentElement.className = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial Load
  useEffect(() => {
    const savedProfile = localStorage.getItem('upocket_profile');
    const savedExpenses = localStorage.getItem('upocket_expenses');
    const savedPockets = localStorage.getItem('upocket_pockets');
    const savedTheme = localStorage.getItem('upocket_theme');

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = 'dark';
    }

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        // Seeding some high-fidelity starting transactions
        const initialMockTxs = [
          { name: 'Supermercado Central', amount: 124.50, type: 'Fixed', date: new Date(Date.now() - 3600000 * 24).toISOString(), details: 'Daily Groceries' },
          { name: 'Cinepolis Premium', amount: 45.00, type: 'Leisure', date: new Date(Date.now() - 3600000 * 48).toISOString(), details: 'Entertainment' },
          { name: 'Starbucks Coffee', amount: 12.80, type: 'Minor', date: new Date(Date.now() - 3600000 * 60).toISOString(), details: 'Personal Treat' }
        ];
        setExpenses(initialMockTxs);
        localStorage.setItem('upocket_expenses', JSON.stringify(initialMockTxs));
      }

      if (savedPockets) {
        setPockets(JSON.parse(savedPockets));
      } else {
        setPockets(DEFAULT_POCKETS);
        localStorage.setItem('upocket_pockets', JSON.stringify(DEFAULT_POCKETS));
      }
      
      setCurrentView('onboarding'); // Lockscreen / login automatically triggers if profile is present
    } else {
      setCurrentView('onboarding');
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('upocket_theme', newTheme);
  };

  const handleOnboardingComplete = (profile, initialPockets, isUnlock) => {
    setUserProfile(profile);
    localStorage.setItem('upocket_profile', JSON.stringify(profile));
    
    if (isUnlock) {
      // Just unlocking lockscreen! Load saved expenses and pockets.
      const savedExpenses = localStorage.getItem('upocket_expenses');
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        setExpenses([]);
      }

      const savedPockets = localStorage.getItem('upocket_pockets');
      if (savedPockets) {
        setPockets(JSON.parse(savedPockets));
      } else {
        setPockets(DEFAULT_POCKETS);
      }
    } else {
      // Fresh wizard onboarding! Save chosen starting pockets
      const finalPockets = initialPockets && initialPockets.length > 0 ? initialPockets : DEFAULT_POCKETS;
      setPockets(finalPockets);
      localStorage.setItem('upocket_pockets', JSON.stringify(finalPockets));

      // Seeding starting pocket funding transactions
      const seedExpenses = [];
      finalPockets.forEach(pocket => {
        if (pocket.currentAmount > 0) {
          seedExpenses.push({
            name: `Semilla: ${pocket.name}`,
            amount: pocket.currentAmount,
            type: 'Minor',
            date: new Date().toISOString(),
            details: 'Fondeo inicial del bolsillo de ahorro'
          });
        }
      });

      setExpenses(seedExpenses);
      localStorage.setItem('upocket_expenses', JSON.stringify(seedExpenses));
    }

    setCurrentView('main');
  };

  const handleAddExpense = (expense) => {
    const updatedExpenses = [expense, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem('upocket_expenses', JSON.stringify(updatedExpenses));
  };

  const handleSavePocket = (updatedPockets) => {
    setPockets(updatedPockets);
    localStorage.setItem('upocket_pockets', JSON.stringify(updatedPockets));
  };

  const handleUpdateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('upocket_profile', JSON.stringify(updatedProfile));
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión? Volverás a la pantalla de bloqueo.')) {
      setCurrentView('onboarding');
    }
  };

  const handleCreateTransactionSubmit = (e) => {
    e.preventDefault();
    if (!txName || !txAmount || parseFloat(txAmount) <= 0) return;

    const mappedType = txCategory === 'Fijos' ? 'Fixed' : txCategory === 'Ocio' ? 'Leisure' : 'Minor';

    const newTx = {
      name: txName,
      amount: parseFloat(txAmount),
      type: mappedType,
      date: new Date().toISOString(),
      details: txDetails || (txCategory === 'Fijos' ? 'Gasto Fijo Obligatorio' : txCategory === 'Ocio' ? 'Gasto Ocio' : 'Gasto Hormiga/Menor')
    };

    handleAddExpense(newTx);
    
    // Reset form & close modal
    setTxName('');
    setTxAmount('');
    setTxCategory('Fijos');
    setTxDetails('');
    setShowTxModal(false);
  };

  const handleUpdateFundsSubmit = (e) => {
    e.preventDefault();
    if (!adjInitialBalance || parseFloat(adjInitialBalance) < 0) return;

    const updated = {
      ...userProfile,
      initialBalance: parseFloat(adjInitialBalance),
      fixedExpenses: adjFixedExpenses !== '' ? parseFloat(adjFixedExpenses) : userProfile.fixedExpenses
    };

    handleUpdateUserProfile(updated);
    setShowFundsModal(false);
  };

  // Calculations
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Available balance adjusts to show original balance minus all spendings
  const remainingBalance = userProfile ? userProfile.initialBalance - totalExpenses : 0;
  
  // Alarm if remaining balance drops below user fixed expenses
  const isCritical = userProfile ? remainingBalance < userProfile.fixedExpenses : false;

  // open and prepopulate forms
  const openFundsModal = () => {
    if (userProfile) {
      setAdjInitialBalance(userProfile.initialBalance);
      setAdjFixedExpenses(userProfile.fixedExpenses);
      setShowFundsModal(true);
    }
  };

  if (currentView === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <h2 className="text-primary font-headline-lg font-bold text-[28px] mb-2 tracking-tight">U-Pocket</h2>
          <p className="text-on-surface-variant font-label-md uppercase tracking-widest animate-pulse">Cargando Bienestar Financiero...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            userProfile={userProfile} 
            expenses={expenses}
            remainingBalance={remainingBalance}
            isCritical={isCritical}
            addExpense={handleAddExpense}
            changeTheme={changeTheme}
            openTxModal={() => { setTxCategory('Fijos'); setShowTxModal(true); }}
            openFundsModal={openFundsModal}
            pockets={pockets}
            setActiveTab={setActiveTab}
          />
        );
      case 'history':
        return (
          <HistoryView 
            expenses={expenses} 
            addExpense={handleAddExpense}
            openTxModal={() => { setTxCategory('Fijos'); setShowTxModal(true); }}
          />
        );
      case 'pockets':
        return (
          <PocketsView 
            pockets={pockets}
            remainingBalance={remainingBalance}
            onUpdatePockets={handleSavePocket}
            onOpenFundsModal={openFundsModal}
            onOpenTxModal={() => { setTxCategory('Fijos'); setShowTxModal(true); }}
            addExpense={handleAddExpense}
          />
        );
      case 'progress':
        return (
          <ProgressView 
            expenses={expenses} 
            userProfile={userProfile}
            isCritical={isCritical}
            remainingBalance={remainingBalance}
            onBack={() => setActiveTab('dashboard')} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex font-sans">
      
      {/* 1. Sidebar Navigation (Desktop only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] bg-surface-dim border-r border-outline-variant/30 flex-col py-lg px-md z-50">
        <div className="mb-xl px-sm">
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">U-Pocket</h1>
          <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Financial Wellness</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all active:scale-[0.98] ${
              activeTab === 'dashboard' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all active:scale-[0.98] ${
              activeTab === 'history' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
            <span className="font-body-md text-body-md">Historial</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('pockets')}
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all active:scale-[0.98] ${
              activeTab === 'pockets' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'pockets' ? "'FILL' 1" : "'FILL' 0" }}>savings</span>
            <span className="font-body-md text-body-md">Bolsillos</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('progress')}
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all active:scale-[0.98] ${
              activeTab === 'progress' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'progress' ? "'FILL' 1" : "'FILL' 0" }}>query_stats</span>
            <span className="font-body-md text-body-md">Estadísticas</span>
          </button>
        </nav>
        
        <div className="mt-auto px-sm pt-lg space-y-md">
          <button 
            onClick={() => { setTxCategory('Fijos'); setShowTxModal(true); }}
            className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-md rounded-lg font-label-md text-label-md font-bold hover:opacity-90 transition-opacity active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined">add</span>
            Nueva Transacción
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-sm bg-white/5 hover:bg-error/10 text-on-surface-variant hover:text-error py-sm rounded-lg font-label-md text-[11px] font-bold border border-outline-variant/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 max-w-xs bg-surface-dim border-r border-outline-variant/30 flex flex-col py-lg px-md h-full z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-xl px-sm">
              <div>
                <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">U-Pocket</h1>
                <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Financial Wellness</p>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              <button 
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                  activeTab === 'dashboard' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-body-md text-body-md">Dashboard</span>
              </button>
              <button 
                onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                  activeTab === 'history' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined">receipt_long</span>
                <span className="font-body-md text-body-md">Historial</span>
              </button>
              <button 
                onClick={() => { setActiveTab('pockets'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                  activeTab === 'pockets' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined">savings</span>
                <span className="font-body-md text-body-md">Bolsillos</span>
              </button>
              <button 
                onClick={() => { setActiveTab('progress'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                  activeTab === 'progress' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined">query_stats</span>
                <span className="font-body-md text-body-md">Estadísticas</span>
              </button>
            </nav>
            <div className="mt-auto px-sm pt-lg space-y-md">
              <button 
                onClick={() => { setTxCategory('Fijos'); setShowTxModal(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-md rounded-lg font-label-md text-label-md font-bold"
              >
                <span className="material-symbols-outlined">add</span>
                Nueva Transacción
              </button>
              
              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-sm bg-white/5 text-on-surface-variant py-sm rounded-lg font-label-md text-[11px] font-bold border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex justify-between items-center w-full h-16 px-lg bg-surface/70 backdrop-blur-xl border-b border-outline-variant/20">
          <div className="flex items-center gap-md flex-1">
            {/* Mobile Hamburger menu */}
            <button className="md:hidden text-on-surface-variant hover:text-on-surface p-1" onClick={() => setMobileMenuOpen(true)}>
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            
            <div className="flex items-center gap-md bg-surface-container-low px-md py-xs rounded-full border border-outline-variant/10 w-full max-w-xs md:max-w-md">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-body-md w-full placeholder:text-on-surface-variant/50 p-0 text-on-surface" 
                placeholder="Buscar análisis, gastos, metas..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-lg">
            {/* Dynamic Premium Theme Selector */}
            <div className="flex gap-sm items-center bg-surface-container-low px-sm py-1 rounded-full border border-outline-variant/10">
              <button 
                onClick={() => changeTheme('dark')}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-primary text-on-primary shadow-sm scale-105 font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                title="Deep Space (Oscuro)"
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
              </button>
              <button 
                onClick={() => changeTheme('light')}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? 'bg-primary text-on-primary shadow-sm scale-105 font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                title="Snow Glass (Claro)"
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
              </button>
              <button 
                onClick={() => changeTheme('custom')}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all ${theme === 'custom' ? 'bg-primary text-on-primary shadow-sm scale-105 font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                title="Emerald Cyberpunk"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
              </button>
            </div>

            <div className="flex gap-md items-center">
              <button className="text-on-surface-variant hover:text-primary transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                {isCritical && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
                )}
              </button>
              <button 
                onClick={openFundsModal}
                className="text-on-surface-variant hover:text-primary transition-colors"
                title="Ajustar Presupuesto Inicial"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                title="Cerrar/Bloquear Sesión"
              >
                <span className="material-symbols-outlined">lock</span>
              </button>
            </div>
            
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/30 hidden xs:block">
              <div className="w-full h-full rounded-full flex items-center justify-center bg-primary/15 text-primary font-bold text-sm select-none border border-primary/20">
                {userProfile && userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Frame */}
        <main className="p-lg flex-1 overflow-x-hidden">
          {renderContent()}
        </main>
        
        {/* Mobile bottom nav spacer */}
        <div className="h-16 md:hidden"></div>
      </div>

      {/* 3. Bottom Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-dim border-t border-outline-variant/30 flex justify-around items-center z-40 px-sm pb-safe backdrop-blur-xl">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'dashboard' ? 'text-primary' : 'text-on-surface-variant/70'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
          <span className="text-[10px] mt-0.5 font-medium">Dashboard</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'history' ? 'text-primary' : 'text-on-surface-variant/70'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
          <span className="text-[10px] mt-0.5 font-medium">Historial</span>
        </button>

        <button 
          onClick={() => { setTxCategory('Fijos'); setShowTxModal(true); }}
          className="flex flex-col items-center justify-center w-12 h-12 bg-primary text-on-primary rounded-full shadow-[0_0_15px_rgba(208,188,255,0.4)] -translate-y-3 active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('pockets')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'pockets' ? 'text-primary' : 'text-on-surface-variant/70'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === 'pockets' ? "'FILL' 1" : "'FILL' 0" }}>savings</span>
          <span className="text-[10px] mt-0.5 font-medium">Bolsillos</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'progress' ? 'text-primary' : 'text-on-surface-variant/70'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === 'progress' ? "'FILL' 1" : "'FILL' 0" }}>query_stats</span>
          <span className="text-[10px] mt-0.5 font-medium">Progreso</span>
        </button>
      </nav>

      {/* ==============================================
          GLOBAL MODAL: CREAR TRANSACCIÓN 
          ============================================== */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-lg py-xl">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowTxModal(false)}></div>
          
          <div className="glass-panel p-lg rounded-xl w-full max-w-md relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-lg pb-sm border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
                Nueva Transacción
              </h3>
              <button 
                onClick={() => setShowTxModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateTransactionSubmit} className="space-y-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">¿Qué compraste / pagaste?</label>
                <input 
                  type="text" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface"
                  placeholder="Ej. Supermercado, Cine, Uber, etc." 
                  value={txName}
                  onChange={(e) => setTxName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Monto ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-primary font-bold"
                    placeholder="0.00" 
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Categoría</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                  >
                    <option value="Fijos">Gasto Fijo</option>
                    <option value="Hormiga">Gasto Hormiga</option>
                    <option value="Ocio">Gasto Ocio</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Detalles Adicionales</label>
                <textarea 
                  rows="2"
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface"
                  placeholder="Ej. Compras semanales, café de la tarde (opcional)..." 
                  value={txDetails}
                  onChange={(e) => setTxDetails(e.target.value)}
                />
              </div>

              <div className="bg-primary-container/10 border border-primary/20 p-md rounded-lg text-xs text-on-surface-variant flex items-start gap-xs">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
                <p>
                  El monto se descontará automáticamente de tu saldo disponible y recalculará tu termómetro de gastos fijos.
                </p>
              </div>

              <div className="pt-sm flex gap-md justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowTxModal(false)}
                  className="px-lg py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold hover:bg-white/5 active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 duration-100 flex items-center gap-xs"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          GLOBAL MODAL: AJUSTAR FONDOS / PRESUPUESTO
          ============================================== */}
      {showFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-lg py-xl">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowFundsModal(false)}></div>
          
          <div className="glass-panel p-lg rounded-xl w-full max-w-md relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-lg pb-sm border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">wallet</span>
                Ajustar Presupuesto
              </h3>
              <button 
                onClick={() => setShowFundsModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateFundsSubmit} className="space-y-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Saldo Semanal / Disponible ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-primary font-bold"
                  placeholder="0.00" 
                  value={adjInitialBalance}
                  onChange={(e) => setAdjInitialBalance(e.target.value)}
                  required
                />
                <p className="text-[11px] text-on-surface-variant mt-sm">Monto asignado total para tu periodo de gastos.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Gastos Fijos Planificados ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-on-surface font-semibold"
                  placeholder="0.00" 
                  value={adjFixedExpenses}
                  onChange={(e) => setAdjFixedExpenses(e.target.value)}
                  required
                />
                <p className="text-[11px] text-on-surface-variant mt-sm">El presupuesto mínimo intocable protegido por la aplicación.</p>
              </div>

              <div className="pt-sm flex gap-md justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowFundsModal(false)}
                  className="px-lg py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold hover:bg-white/5 active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 duration-100"
                >
                  Actualizar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
