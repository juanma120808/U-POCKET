import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function Onboarding({ onComplete }) {
  // Database & Profile States
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Cloud Config States
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [cloudStatus, setCloudStatus] = useState(db.isCloudActive());
  const [cloudMsg, setCloudMsg] = useState('');

  // Sign Up & Setup State
  const [step, setStep] = useState(1); // 1: Sign up credentials, 2: Financials & Pockets, 3: Fixed Expenses
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState('');
  const [savingGoal, setSavingGoal] = useState('');
  
  // Starting Pockets Seed Config
  const [activePockets, setActivePockets] = useState([
    { id: '1', name: 'Fondo de Emergencia', targetAmount: '2000', currentAmount: '', category: 'Seguridad', date: 'Indefinido', icon: 'health_and_safety', checked: true },
    { id: '2', name: 'Viajes / Vacaciones', targetAmount: '3000', currentAmount: '', category: 'Lifestyle', date: 'Dic 2026', icon: 'flight_takeoff', checked: false },
    { id: '3', name: 'Tecnología', targetAmount: '1500', currentAmount: '', category: 'Productividad', date: 'Dic 2026', icon: 'laptop_mac', checked: false },
  ]);

  // Fixed Expenses State
  const [fixedExpenses, setFixedExpenses] = useState([{ name: '', amount: '' }]);

  // Formatting helper
  const formatMoney = (val) => `$${parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const loadUsers = async () => {
    try {
      const allUsers = await db.getUsers();
      setUsers(allUsers);
      
      const activeEmail = localStorage.getItem('upocket_active_user_email');
      if (activeEmail) {
        const activeUser = allUsers.find(u => u.email.toLowerCase() === activeEmail.toLowerCase());
        if (activeUser) {
          setSelectedUser(activeUser);
          setIsLoginMode(true);
        } else if (allUsers.length > 0) {
          setSelectedUser(allUsers[0]);
          setIsLoginMode(true);
        }
      } else if (allUsers.length > 0) {
        setSelectedUser(allUsers[0]);
        setIsLoginMode(true);
      }
    } catch (err) {
      console.error('Error cargando base de datos:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    const config = db.getCloudConfig();
    setCloudUrl(config.url);
    setCloudKey(config.key);
    setCloudStatus(db.isCloudActive());
  }, []);

  // Handle simulated unlocking
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    if (loginPassword === selectedUser.password) {
      setLoginError('');
      localStorage.setItem('upocket_active_user_email', selectedUser.email.toLowerCase());
      onComplete(selectedUser, null, true); // True means unlock existing session
    } else {
      setLoginError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  // Cloud database config handler
  const handleCloudConfigSubmit = async (e) => {
    e.preventDefault();
    setCloudMsg('Probando conexión con Supabase...');
    try {
      const ok = await db.setCloudConfig(cloudUrl, cloudKey);
      if (ok) {
        setCloudStatus(true);
        setCloudMsg('🟢 ¡Base de datos conectada correctamente y sincronizada!');
        setTimeout(async () => {
          setShowCloudConfig(false);
          setCloudMsg('');
          await loadUsers();
        }, 1500);
      } else {
        setCloudStatus(false);
        setCloudMsg('❌ Error al inicializar. Revisa la URL y la Anon Key.');
      }
    } catch (err) {
      setCloudStatus(false);
      setCloudMsg('❌ Error de conexión. Verifica los datos.');
    }
  };

  const handleDisconnectCloud = () => {
    if (confirm('¿Deseas desconectar la base de datos en la nube?\nU-Pocket volverá a operar en Modo Local offline.')) {
      db.clearCloudConfig();
      setCloudStatus(false);
      setCloudUrl('');
      setCloudKey('');
      setCloudMsg('Desconectado. Recargando base de datos local...');
      setTimeout(async () => {
        setShowCloudConfig(false);
        setCloudMsg('');
        await loadUsers();
      }, 1000);
    }
  };

  // Fixed expenses dynamic handlers
  const handleFixedChange = (index, field, value) => {
    const newFixed = [...fixedExpenses];
    newFixed[index][field] = value;
    setFixedExpenses(newFixed);
  };

  const addFixedExpense = () => {
    setFixedExpenses([...fixedExpenses, { name: '', amount: '' }]);
  };

  const removeFixedExpense = (index) => {
    const newFixed = fixedExpenses.filter((_, i) => i !== index);
    setFixedExpenses(newFixed);
  };

  // Toggle starting pocket
  const handleTogglePocket = (id) => {
    setActivePockets(activePockets.map(p => {
      if (p.id === id) return { ...p, checked: !p.checked };
      return p;
    }));
  };

  // Change pocket amount
  const handlePocketAmountChange = (id, field, value) => {
    setActivePockets(activePockets.map(p => {
      if (p.id === id) return { ...p, [field]: value };
      return p;
    }));
  };

  // Step transitions
  const handleNextStep = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        alert('Por favor completa todos los campos de registro.');
        return;
      }
      // Check duplicate emails
      const dup = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (dup) {
        alert('Este correo electrónico ya está registrado. Por favor inicia sesión o usa otro correo.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!balance || parseFloat(balance) <= 0) {
        alert('Por favor ingresa un saldo inicial válido.');
        return;
      }
      const totalSeeds = activePockets
        .filter(p => p.checked)
        .reduce((sum, p) => sum + (parseFloat(p.currentAmount) || 0), 0);

      if (totalSeeds > parseFloat(balance)) {
        alert(`Tus fondos de ahorro semilla (${formatMoney(totalSeeds)}) no pueden exceder tus ingresos iniciales (${formatMoney(parseFloat(balance))}).`);
        return;
      }
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Full onboarding wizard submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!balance) return;

    const totalFixed = fixedExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const validFixedList = fixedExpenses.filter(f => f.name && f.amount);

    const profile = {
      name: name,
      email: email.toLowerCase(),
      password: password,
      initialBalance: parseFloat(balance),
      fixedExpensesList: validFixedList,
      fixedExpenses: totalFixed,
      savingGoal: parseFloat(savingGoal) || 0,
      theme: 'dark'
    };

    const initialPockets = activePockets
      .filter(p => p.checked)
      .map(p => ({
        id: p.id,
        name: p.name,
        targetAmount: parseFloat(p.targetAmount) || 0,
        currentAmount: parseFloat(p.currentAmount) || 0,
        category: p.category,
        date: p.date,
        icon: p.icon
      }));

    try {
      await db.registerUser(profile);
      localStorage.setItem('upocket_active_user_email', profile.email);
      onComplete(profile, initialPockets, false);
    } catch (err) {
      alert('Error guardando perfil en la base de datos: ' + err.message);
    }
  };

  // ==========================================
  // RENDER CLOUD DB CONFIGURATION MODAL
  // ==========================================
  if (showCloudConfig) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-background px-lg py-xl relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-xl animate-fade-in relative z-10">
          <div className="text-center mb-lg">
            <span className="material-symbols-outlined text-[36px] text-primary mb-sm animate-pulse">cloud</span>
            <h1 className="font-display-lg text-[32px] font-bold text-white tracking-tight">Sincronización en la Nube</h1>
            <p className="text-on-surface-variant text-body-md mt-sm max-w-sm mx-auto">
              Conecta un backend de Supabase para habilitar inicio de sesión multidispositivo y respaldo en tiempo real.
            </p>
          </div>

          <form onSubmit={handleCloudConfigSubmit} className="glass-panel p-lg md:p-xl rounded-xl space-y-md border border-outline-variant/20 shadow-2xl">
            <div className="space-y-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Supabase Project URL</label>
              <input 
                type="url" 
                className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary font-mono" 
                placeholder="https://your-project-id.supabase.co" 
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Supabase Anon Key</label>
              <textarea 
                rows="3"
                className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary font-mono text-xs" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key..." 
                value={cloudKey}
                onChange={(e) => setCloudKey(e.target.value)}
                required
              />
            </div>

            {cloudMsg && (
              <p className="text-xs font-semibold text-primary animate-fade-in bg-primary/5 p-sm rounded border border-primary/10">
                {cloudMsg}
              </p>
            )}

            <div className="bg-surface-container border border-outline-variant/10 p-md rounded-lg text-xs text-on-surface-variant space-y-sm">
              <p className="font-bold text-white flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                ¿Cómo obtenerlo gratis en 1 minuto?
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ve a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">supabase.com</a> y crea un proyecto gratuito.</li>
                <li>En **Project Settings &gt; API**, copia la URL y la Anon Key.</li>
                <li>En **SQL Editor**, copia y pega el script de creación de tablas provisto en el manual del plan de U-Pocket.</li>
              </ol>
            </div>

            <div className="flex gap-md pt-sm">
              <button 
                type="button" 
                onClick={() => setShowCloudConfig(false)}
                className="w-1/2 py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold text-body-md hover:bg-white/5 active:scale-95"
              >
                Volver
              </button>
              
              <button 
                type="submit" 
                className="w-1/2 py-md bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Probar y Conectar
              </button>
            </div>

            {cloudStatus && (
              <div className="pt-md border-t border-outline-variant/10 text-center">
                <button 
                  type="button"
                  onClick={handleDisconnectCloud}
                  className="text-xs text-error hover:underline font-semibold"
                >
                  Desconectar Base de Datos en la Nube
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SELECT ACCOUNT / LOCKSCREEN VIEW
  // ==========================================
  if (isLoginMode && users.length > 0) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-background px-lg py-xl relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Floating Database Sync Indicator */}
        <button 
          onClick={() => setShowCloudConfig(true)}
          className={`absolute top-md right-md flex items-center gap-xs px-md py-sm rounded-full border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            cloudStatus 
              ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              : 'bg-white/5 border-outline-variant/20 text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">cloud</span>
          {cloudStatus ? 'Base de Datos: Nube' : 'Base de Datos: Local'}
        </button>

        <div className="w-full max-w-lg animate-fade-in relative z-10">
          
          {/* Subtitle / Header */}
          <div className="text-center mb-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-md">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <h1 className="font-display-lg text-[32px] md:text-[36px] font-bold text-on-background tracking-tight">
              Bienvenido a <span className="text-primary">U-Pocket</span>
            </h1>
            <p className="text-on-surface-variant text-body-md mt-sm leading-relaxed">
              Selecciona tu cuenta e ingresa tu contraseña de seguridad.
            </p>
          </div>

          {/* Account selector panel */}
          {!selectedUser ? (
            <div className="glass-panel p-lg rounded-xl space-y-md border border-outline-variant/20 shadow-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-sm">Seleccionar Cuenta Registrada</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md max-h-[300px] overflow-y-auto pr-xs custom-scrollbar">
                {users.map((user) => (
                  <div 
                    key={user.email}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center gap-md p-md bg-white/[0.02] hover:bg-primary/5 border border-outline-variant/15 hover:border-primary/40 rounded-xl cursor-pointer transition-all active:scale-[0.98] duration-150 group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary font-bold text-md uppercase transition-colors">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-md border-t border-outline-variant/10 flex flex-col sm:flex-row gap-md justify-between items-center">
                <button 
                  onClick={() => setIsLoginMode(false)}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  Registrar nueva cuenta
                </button>

                <button 
                  onClick={() => setShowCloudConfig(true)}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  Configurar base de datos en la nube
                </button>
              </div>
            </div>
          ) : (
            /* Individual Lockscreen Mode for chosen account */
            <form onSubmit={handleLoginSubmit} className="glass-panel p-lg rounded-xl space-y-md border border-outline-variant/20 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-md p-md bg-white/[0.02] border border-outline-variant/25 rounded-lg relative">
                <button 
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-sm right-sm text-on-surface-variant hover:text-white p-1"
                  title="Cambiar de cuenta"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                </button>

                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex items-center justify-center bg-primary/10 text-primary font-bold text-lg uppercase">
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-md font-semibold text-white truncate">{selectedUser.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Contraseña</label>
                <input 
                  type="password" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary transition-colors" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-error font-semibold flex items-center gap-xs animate-fade-in">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {loginError}
                </p>
              )}

              <button 
                type="submit" 
                className="w-full py-md bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Desbloquear U-Pocket
              </button>

              <div className="pt-sm border-t border-outline-variant/10 flex justify-between text-center">
                <button 
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
                >
                  ← Cambiar de cuenta
                </button>
                <button 
                  type="button"
                  onClick={() => { setSelectedUser(null); setIsLoginMode(false); }}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
                >
                  Registrar otra cuenta
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SIGN UP & ONBOARDING WIZARD
  // ==========================================
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-background px-lg py-xl relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <button 
        onClick={() => setShowCloudConfig(true)}
        className={`absolute top-md right-md flex items-center gap-xs px-md py-sm rounded-full border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
          cloudStatus 
            ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
            : 'bg-white/5 border-outline-variant/20 text-on-surface-variant hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">cloud</span>
        {cloudStatus ? 'Base de Datos: Nube' : 'Base de Datos: Local'}
      </button>

      <div className="w-full max-w-xl animate-fade-in relative z-10">
        
        {/* Top Wizard Navigation Steps */}
        <div className="flex items-center justify-between max-w-xs mx-auto mb-lg">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 1 ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 text-on-surface-variant'
            }`}>1</div>
            <span className="text-[10px] mt-xs uppercase font-bold text-on-surface-variant">Acceso</span>
          </div>
          <div className={`flex-1 h-0.5 mx-sm ${step >= 2 ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 2 ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 text-on-surface-variant'
            }`}>2</div>
            <span className="text-[10px] mt-xs uppercase font-bold text-on-surface-variant">Presupuesto</span>
          </div>
          <div className={`flex-1 h-0.5 mx-sm ${step >= 3 ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 3 ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 text-on-surface-variant'
            }`}>3</div>
            <span className="text-[10px] mt-xs uppercase font-bold text-on-surface-variant">Gastos Fijos</span>
          </div>
        </div>

        {/* Branding Title */}
        <div className="text-center mb-lg">
          <h1 className="font-display-lg text-[32px] md:text-[38px] font-bold text-on-background tracking-tight">
            Comienza con <span className="text-primary">U-Pocket</span>
          </h1>
          <p className="text-on-surface-variant text-body-md mt-sm max-w-sm mx-auto leading-relaxed">
            {step === 1 && 'Crea tu cuenta de acceso simulado local o en la nube.'}
            {step === 2 && 'Ingresa tus ingresos, metas y distribuye tus primeros ahorros.'}
            {step === 3 && 'Define tus obligaciones recurrentes fijas que U-Pocket debe resguardar.'}
          </p>
        </div>

        <div className="glass-panel p-lg md:p-xl rounded-xl border border-outline-variant/20 shadow-2xl">
          
          {/* STEP 1: CREDENTIALS REGISTRATION */}
          {step === 1 && (
            <div className="space-y-md">
              <div className="space-y-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nombre de Usuario</label>
                <input 
                  type="text" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary transition-colors" 
                  placeholder="Juan Manuel" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary transition-colors" 
                  placeholder="juanma@udem.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Contraseña</label>
                <input 
                  type="password" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary transition-colors" 
                  placeholder="Elige una contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                  {cloudStatus 
                    ? 'Esta contraseña se guardará en tu base de datos Supabase para ingresar desde cualquier dispositivo.'
                    : 'Esta contraseña se guardará localmente para tu login lockscreen en esta computadora.'}
                </p>
              </div>

              <div className="flex gap-md pt-sm">
                {users.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setIsLoginMode(true)}
                    className="w-1/3 py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold text-body-md hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Ingresar
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className={`py-md bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-xs ${
                    users.length > 0 ? 'w-2/3' : 'w-full'
                  }`}
                >
                  Siguiente Paso
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FINANCIAL PROFILE & SAVINGS POCKETS */}
          {step === 2 && (
            <div className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[16px]">account_balance_wallet</span>
                    Ingresos de la Semana ($)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-primary font-bold focus:border-primary font-mono transition-colors" 
                    placeholder="0.00" 
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">Saldo inicial asignado para tus gastos de la semana.</p>
                </div>

                <div className="space-y-xs">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[16px]">flag</span>
                    Meta Ahorro Semanal ($)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:border-primary font-mono transition-colors" 
                    placeholder="Opcional" 
                    value={savingGoal}
                    onChange={(e) => setSavingGoal(e.target.value)}
                  />
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">Cuánto te propones retener sin gastar.</p>
                </div>
              </div>

              {/* Seeding Pockets */}
              <div className="space-y-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">savings</span>
                  Activar Bolsillos de Ahorro con Saldo Semilla
                </label>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Crea bolsillos para apartar dinero. Puedes fonearlos de inmediato desde tus ingresos iniciales.
                </p>

                <div className="space-y-md">
                  {activePockets.map((pocket) => (
                    <div 
                      key={pocket.id} 
                      className={`p-md rounded-lg border transition-all ${
                        pocket.checked 
                          ? 'bg-primary/5 border-primary/45 shadow-sm' 
                          : 'bg-white/[0.01] border-outline-variant/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-sm cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="rounded border-outline-variant/40 bg-black text-primary focus:ring-primary h-4 w-4"
                            checked={pocket.checked}
                            onChange={() => handleTogglePocket(pocket.id)}
                          />
                          <div className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{pocket.icon}</span>
                            <span className="font-body-md font-semibold text-white">{pocket.name}</span>
                          </div>
                        </label>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant/15">{pocket.category}</span>
                      </div>

                      {pocket.checked && (
                        <div className="grid grid-cols-2 gap-sm mt-md pt-sm border-t border-outline-variant/10 animate-fade-in">
                          <div>
                            <label className="block text-[10px] text-on-surface-variant uppercase font-bold mb-1">Monto Meta ($)</label>
                            <input 
                              type="number"
                              className="w-full bg-black border border-outline-variant/30 rounded py-1 px-2 text-xs text-white font-mono"
                              value={pocket.targetAmount}
                              onChange={(e) => handlePocketAmountChange(pocket.id, 'targetAmount', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-on-surface-variant uppercase font-bold mb-1">Semilla Ahorrado ($)</label>
                            <input 
                              type="number"
                              className="w-full bg-black border border-outline-variant/30 rounded py-1 px-2 text-xs text-primary font-mono font-bold"
                              value={pocket.currentAmount}
                              placeholder="0.00"
                              onChange={(e) => handlePocketAmountChange(pocket.id, 'currentAmount', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-md pt-md">
                <button 
                  type="button" 
                  onClick={handleBackStep}
                  className="w-1/3 py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold text-body-md hover:bg-white/5 active:scale-95 transition-all"
                >
                  Atrás
                </button>
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="w-2/3 py-md bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Siguiente Paso
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FIXED EXPENSES */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="space-y-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">commute</span>
                  Tus Gastos Fijos (ej. Renta, Comidas, Transporte)
                </label>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  U-Pocket bloqueará mentalmente este presupuesto del saldo disponible, protegiéndolo de cualquier gasto no planificado.
                </p>
                
                <div className="space-y-sm max-h-[220px] overflow-y-auto pr-xs custom-scrollbar">
                  {fixedExpenses.map((expense, index) => (
                    <div key={index} className="flex gap-md items-center animate-fade-in">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface placeholder:text-on-surface-variant/30" 
                          placeholder="Concepto (ej. Alquiler)" 
                          value={expense.name}
                          onChange={(e) => handleFixedChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-[130px] relative">
                        <span className="absolute left-sm top-1/2 -translate-y-1/2 font-mono text-body-md text-on-surface-variant/70">$</span>
                        <input 
                          type="number" 
                          className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm pl-md pr-md text-body-md font-mono text-on-surface font-semibold placeholder:text-on-surface-variant/30" 
                          placeholder="0.00" 
                          value={expense.amount}
                          onChange={(e) => handleFixedChange(index, 'amount', e.target.value)}
                          required
                        />
                      </div>
                      
                      {fixedExpenses.length > 1 && (
                        <button 
                          type="button" 
                          className="p-sm text-error bg-error/10 hover:bg-error/20 border border-error/20 rounded-lg transition-colors flex items-center justify-center shrink-0 active:scale-95 duration-100" 
                          onClick={() => removeFixedExpense(index)}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button 
                  type="button" 
                  className="inline-flex items-center gap-xs px-md py-sm bg-white/5 hover:bg-white/10 text-on-surface border border-outline-variant/20 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
                  onClick={addFixedExpense}
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Añadir otro gasto fijo
                </button>
              </div>

              <div className="flex gap-md pt-lg border-t border-outline-variant/10">
                <button 
                  type="button" 
                  onClick={handleBackStep}
                  className="w-1/3 py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold text-body-md hover:bg-white/5 active:scale-95 transition-all"
                >
                  Atrás
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-md bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-xs"
                >
                  Comenzar mi bienestar 🚀
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
