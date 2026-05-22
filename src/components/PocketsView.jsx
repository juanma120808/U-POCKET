import React, { useState } from 'react';

export default function PocketsView({ 
  pockets, 
  remainingBalance, 
  onUpdatePockets, 
  onOpenFundsModal, 
  onOpenTxModal,
  addExpense 
}) {
  // Modals state
  const [showAddPocketModal, setShowAddPocketModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [selectedPocket, setSelectedPocket] = useState(null);
  
  // New Pocket Form State
  const [pocketName, setPocketName] = useState('');
  const [pocketTarget, setPocketTarget] = useState('');
  const [pocketCurrent, setPocketCurrent] = useState('');
  const [pocketCategory, setPocketCategory] = useState('Lifestyle');
  const [pocketDate, setPocketDate] = useState('');
  const [pocketIcon, setPocketIcon] = useState('flight_takeoff');

  // Transfer Form State
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');

  // Premium preselected icons list
  const POCKET_ICONS = [
    { name: 'flight_takeoff', label: 'Viaje / Vuelo' },
    { name: 'health_and_safety', label: 'Emergencia / Salud' },
    { name: 'laptop_mac', label: 'Tecnología / Laptop' },
    { name: 'home', label: 'Hogar / Inmueble' },
    { name: 'directions_car', label: 'Vehículo / Auto' },
    { name: 'school', label: 'Educación / Curso' },
    { name: 'sports_esports', label: 'Videojuegos / Ocio' },
    { name: 'redeem', label: 'Regalos / Ahorro' },
    { name: 'savings', label: 'Hucha / General' }
  ];

  // Helper to format currency
  const formatMoney = (val) => `$${parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Get color schemes matching Stitch design
  const getCategoryStyles = (category) => {
    switch (category?.toLowerCase()) {
      case 'lifestyle':
        return { text: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20' };
      case 'seguridad':
        return { text: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
      case 'productividad':
        return { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' };
      case 'futuro':
        return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
      case 'mantenimiento':
        return { text: 'text-outline', bg: 'bg-outline/10', border: 'border-outline/20' };
      default:
        return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
    }
  };

  // Stats Calculations
  const totalSaved = pockets.reduce((acc, p) => acc + p.currentAmount, 0);
  const totalTarget = pockets.reduce((acc, p) => acc + p.targetAmount, 0);
  const pocketsCount = pockets.length;
  
  // Custom Monthly Savings Goal (dynamic percentage toward e.g. $2,000 monthly)
  const monthlyGoal = 2000;
  const currentMonthSaved = Math.min(monthlyGoal, pockets.reduce((acc, p) => acc + (p.currentAmount * 0.05), 0)); // Simulated monthly contribution
  const monthlyGoalPercent = Math.min(100, Math.round((totalSaved / monthlyGoal) * 100));

  // Handle New Pocket Submission
  const handleCreatePocket = (e) => {
    e.preventDefault();
    if (!pocketName || !pocketTarget || parseFloat(pocketTarget) <= 0) return;

    const newPocket = {
      id: Date.now().toString(),
      name: pocketName,
      targetAmount: parseFloat(pocketTarget),
      currentAmount: parseFloat(pocketCurrent) || 0,
      category: pocketCategory,
      date: pocketDate || 'Indefinido',
      icon: pocketIcon
    };

    // If they seeded it with some initial amount, we register a transfer transaction
    if (newPocket.currentAmount > 0) {
      if (newPocket.currentAmount > remainingBalance) {
        alert('El monto inicial del bolsillo excede tu saldo disponible.');
        return;
      }
      addExpense({
        name: `Semilla: ${newPocket.name}`,
        amount: newPocket.currentAmount,
        type: 'Minor',
        date: new Date().toISOString(),
        details: 'Fondeo inicial del bolsillo de ahorro'
      });
    }

    const updated = [...pockets, newPocket];
    onUpdatePockets(updated);

    // Reset Form
    setPocketName('');
    setPocketTarget('');
    setPocketCurrent('');
    setPocketCategory('Lifestyle');
    setPocketDate('');
    setPocketIcon('flight_takeoff');
    setShowAddPocketModal(false);
  };

  // Open Transfer Modal
  const openTransfer = (pocket, type) => {
    setSelectedPocket(pocket);
    setTransferType(type);
    setTransferAmount('');
    setTransferError('');
    setShowTransferModal(true);
  };

  // Handle Deposit / Withdrawal Transfer Submission
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return;

    if (transferType === 'deposit') {
      // Safety Check: Are fijos protected?
      // Available balance cannot be exceeded
      if (amount > remainingBalance) {
        setTransferError('No tienes suficientes fondos en tu saldo disponible.');
        return;
      }
      
      // Let's check if depositing this amount leaves the balance below the fixed expenses threshold
      // Wait, we need to read the fixed expenses from the profile, which is not directly passed to us.
      // But we can check if it exceeds remaining balance.

      // Update pocket amount
      const updated = pockets.map(p => {
        if (p.id === selectedPocket.id) {
          return { ...p, currentAmount: p.currentAmount + amount };
        }
        return p;
      });

      // Register checking account debit transaction
      addExpense({
        name: `Ahorro: ${selectedPocket.name}`,
        amount: amount,
        type: 'Minor',
        date: new Date().toISOString(),
        details: 'Traslado de fondos a bolsillo de ahorro'
      });

      onUpdatePockets(updated);
    } else {
      // Withdrawal
      if (amount > selectedPocket.currentAmount) {
        setTransferError('El monto excede lo que tienes ahorrado en este bolsillo.');
        return;
      }

      // Update pocket amount
      const updated = pockets.map(p => {
        if (p.id === selectedPocket.id) {
          return { ...p, currentAmount: Math.max(0, p.currentAmount - amount) };
        }
        return p;
      });

      // Register checking account credit transaction (negative expense adds to balance!)
      addExpense({
        name: `Retiro: ${selectedPocket.name}`,
        amount: -amount,
        type: 'Minor',
        date: new Date().toISOString(),
        details: 'Retorno de ahorros a saldo disponible'
      });

      onUpdatePockets(updated);
    }

    setShowTransferModal(false);
  };

  // Handle Delete Pocket
  const handleDeletePocket = (id, name, currentAmount) => {
    if (confirm(`¿Estás seguro de eliminar el bolsillo "${name}"?\nCualquier ahorro acumulado será retornado a tu saldo disponible.`)) {
      if (currentAmount > 0) {
        // Return funds to available balance
        addExpense({
          name: `Cierre: ${name}`,
          amount: -currentAmount,
          type: 'Minor',
          date: new Date().toISOString(),
          details: 'Retorno de fondos por liquidación de bolsillo'
        });
      }
      const updated = pockets.filter(p => p.id !== id);
      onUpdatePockets(updated);
    }
  };

  return (
    <div className="space-y-lg animate-fade-in pb-xl">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Mis Bolsillos</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Administra tus metas financieras, simula traslados y haz seguimiento detallado de tus ahorros.
          </p>
        </div>
        <button 
          onClick={() => setShowAddPocketModal(true)}
          className="bg-primary text-on-primary py-sm px-lg rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Nuevo Bolsillo
        </button>
      </div>

      {/* 2. Available Funds Alert Bar */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-md flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined">wallet</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Saldo Disponible para Fondear</p>
            <p className="text-headline-md text-primary font-mono font-bold">{formatMoney(remainingBalance)}</p>
          </div>
        </div>
        <div className="text-xs text-on-surface-variant max-w-md leading-relaxed">
          Los fondos que destines a tus bolsillos se retirarán de tu saldo disponible semanal para proteger tu presupuesto operativo diario y tus gastos fijos planificados.
        </div>
      </div>

      {/* 3. Bento Grid of Pocket Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
        {pockets.map((pocket) => {
          const styles = getCategoryStyles(pocket.category);
          const percent = pocket.targetAmount > 0 ? Math.min(100, Math.round((pocket.currentAmount / pocket.targetAmount) * 100)) : 0;
          const missing = Math.max(0, pocket.targetAmount - pocket.currentAmount);

          return (
            <div 
              key={pocket.id} 
              className="glass-card rounded-xl p-lg flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20 min-h-[260px] hover:border-primary/40"
            >
              <div>
                <div className="flex justify-between items-start mb-lg">
                  <div className={`p-3 rounded-lg ${styles.bg} ${styles.text} border ${styles.border} flex items-center justify-center`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {pocket.icon || 'savings'}
                    </span>
                  </div>
                  
                  <div className="relative group/menu">
                    <button 
                      onClick={() => handleDeletePocket(pocket.id, pocket.name, pocket.currentAmount)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-white/5"
                      title="Eliminar bolsillo"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="mb-md">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles.bg} ${styles.text} border ${styles.border} mb-sm inline-block`}>
                    {pocket.category}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-white font-bold leading-snug line-clamp-1">{pocket.name}</h3>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mt-xs">
                    Plazo: {pocket.date}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-md border-t border-outline-variant/10">
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant">Ahorrado</span>
                    <span className="font-headline-md text-headline-md text-primary font-mono font-bold">
                      {formatMoney(pocket.currentAmount)}
                    </span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant font-mono">
                    de {formatMoney(pocket.targetAmount)}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-primary progress-bar-glow rounded-full transition-all duration-1000" 
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-xs text-[11px]">
                  <span className="text-primary font-bold">{percent}%</span>
                  <span className="text-on-surface-variant font-medium">
                    {missing > 0 ? `Faltan ${formatMoney(missing)}` : '¡Objetivo Completado! 🎉'}
                  </span>
                </div>

                {/* Transfer actions */}
                <div className="grid grid-cols-2 gap-sm mt-lg">
                  <button 
                    onClick={() => openTransfer(pocket, 'deposit')}
                    className="flex items-center justify-center gap-xs border border-primary/30 hover:border-primary text-primary hover:bg-primary/5 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    Ahorrar
                  </button>
                  <button 
                    onClick={() => openTransfer(pocket, 'withdraw')}
                    className="flex items-center justify-center gap-xs border border-outline-variant/30 hover:border-on-surface-variant text-on-surface-variant hover:bg-white/5 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    Retirar
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {pockets.length === 0 && (
          <div className="col-span-full glass-card p-xl text-center rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-[48px] text-primary/40 block mb-sm">savings</span>
            <h3 className="font-headline-md text-headline-md text-white font-bold mb-xs">No tienes bolsillos de ahorro</h3>
            <p className="text-on-surface-variant font-body-md text-body-md max-w-md mx-auto mb-lg">
              Crea tu primer bolsillo para estructurar tus metas de forma independiente (ej. vacaciones, fondo de emergencia, gadgets).
            </p>
            <button 
              onClick={() => setShowAddPocketModal(true)}
              className="bg-primary text-on-primary py-sm px-lg rounded-lg font-label-md text-label-md font-bold transition-all hover:opacity-90 active:scale-95"
            >
              Crear Bolsillo
            </button>
          </div>
        )}
      </div>

      {/* 4. Stats Summary Section */}
      <section className="mt-xl glass-card rounded-xl p-lg grid grid-cols-1 md:grid-cols-3 gap-lg divide-y md:divide-y-0 md:divide-x divide-outline-variant/20 border border-outline-variant/20 bg-surface-dim">
        <div className="pb-md md:pb-0 md:pr-lg">
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase tracking-wider font-bold">Total Ahorrado en Bolsillos</p>
          <div className="flex items-end gap-sm">
            <h4 className="font-display-lg text-[32px] font-bold text-primary font-mono">{formatMoney(totalSaved)}</h4>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold mb-1 border border-primary/20">Activo</span>
          </div>
        </div>
        
        <div className="py-md md:py-0 md:px-lg">
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase tracking-wider font-bold">Bolsillos Activos</p>
          <h4 className="font-display-lg text-[32px] font-bold text-on-surface font-mono">
            {pocketsCount < 10 ? `0${pocketsCount}` : pocketsCount}
          </h4>
        </div>
        
        <div className="pt-md md:pt-0 md:pl-lg">
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase tracking-wider font-bold">Meta General de Ahorro</p>
          <div className="flex flex-col">
            <div className="flex justify-between mb-xs">
              <span className="font-data-tabular text-data-tabular font-semibold text-on-surface">
                {formatMoney(totalSaved)} / {formatMoney(totalTarget)}
              </span>
              <span className="font-label-md text-label-md text-primary font-bold">
                {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-primary rounded-full progress-bar-glow" 
                style={{ width: `${totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Background Decorative Elements */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-24 left-48 w-64 h-64 bg-tertiary/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>

      {/* ==============================================
          MODAL: NUEVO BOLSILLO
          ============================================== */}
      {showAddPocketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-lg py-xl">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setShowAddPocketModal(false)}></div>
          
          <div className="glass-card p-lg rounded-xl w-full max-w-md relative z-10 animate-fade-in border border-outline-variant/30 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-lg pb-sm border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs font-bold">
                <span className="material-symbols-outlined text-primary text-[24px]">savings</span>
                Nuevo Bolsillo de Ahorro
              </h3>
              <button 
                onClick={() => setShowAddPocketModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreatePocket} className="space-y-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Nombre del Bolsillo</label>
                <input 
                  type="text" 
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                  placeholder="Ej. Vacaciones, Enganche, Seguro..." 
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Monto Meta ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-primary font-bold focus:outline-none focus:border-primary transition-all"
                    placeholder="0.00" 
                    value={pocketTarget}
                    onChange={(e) => setPocketTarget(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Fondeo Inicial ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                    placeholder="0.00" 
                    value={pocketCurrent}
                    onChange={(e) => setPocketCurrent(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Categoría</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                    value={pocketCategory}
                    onChange={(e) => setPocketCategory(e.target.value)}
                  >
                    <option value="Lifestyle">✈️ Lifestyle</option>
                    <option value="Seguridad">🛡️ Seguridad</option>
                    <option value="Productividad">💻 Productividad</option>
                    <option value="Futuro">🏠 Futuro</option>
                    <option value="Mantenimiento">🚗 Mantenimiento</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Plazo Limite</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                    placeholder="Ej. Nov 2024, Dic 2026..." 
                    value={pocketDate}
                    onChange={(e) => setPocketDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Selecciona un Icono</label>
                <div className="grid grid-cols-5 gap-sm bg-[#0A0A0A] p-sm rounded-lg border border-outline-variant/20">
                  {POCKET_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setPocketIcon(ico.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        pocketIcon === ico.name 
                          ? 'bg-primary/20 text-primary border border-primary/40 scale-110 font-bold' 
                          : 'text-on-surface-variant hover:bg-white/5'
                      }`}
                      title={ico.label}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {ico.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {parseFloat(pocketCurrent) > 0 && (
                <div className="bg-primary/5 border border-primary/20 p-md rounded-lg text-xs text-on-surface-variant flex items-start gap-xs">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
                  <p>
                    El Fondeo Inicial de <strong>{formatMoney(pocketCurrent)}</strong> se descontará de tu Saldo Disponible actual.
                  </p>
                </div>
              )}

              <div className="pt-sm flex gap-md justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowAddPocketModal(false)}
                  className="px-lg py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold hover:bg-white/5 active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 duration-100"
                >
                  Crear Bolsillo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: AHORRAR / RETIRAR FONDOS
          ============================================== */}
      {showTransferModal && selectedPocket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-lg py-xl">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setShowTransferModal(false)}></div>
          
          <div className="glass-card p-lg rounded-xl w-full max-w-md relative z-10 animate-fade-in border border-outline-variant/30">
            <div className="flex justify-between items-center mb-lg pb-sm border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs font-bold">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {transferType === 'deposit' ? 'arrow_downward' : 'arrow_upward'}
                </span>
                {transferType === 'deposit' ? 'Ahorrar en Bolsillo' : 'Retirar del Bolsillo'}
              </h3>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-md bg-white/[0.02] p-md rounded-lg border border-outline-variant/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">Bolsillo Objetivo</p>
                <p className="font-body-lg text-body-lg font-semibold text-white">{selectedPocket.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">Ahorro Actual</p>
                <p className="font-body-lg text-body-lg font-mono font-bold text-primary">{formatMoney(selectedPocket.currentAmount)}</p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">Monto a Trasladar ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-sm px-md font-mono text-body-md text-primary font-bold focus:outline-none focus:border-primary transition-all"
                  placeholder="0.00" 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  autoFocus
                />
                
                {transferType === 'deposit' ? (
                  <div className="flex justify-between items-center text-[11px] text-on-surface-variant mt-sm font-semibold">
                    <span>Saldo Disponible Máximo:</span>
                    <span className="text-primary font-mono">{formatMoney(remainingBalance)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[11px] text-on-surface-variant mt-sm font-semibold">
                    <span>Fondos en Bolsillo Máximo:</span>
                    <span className="text-primary font-mono">{formatMoney(selectedPocket.currentAmount)}</span>
                  </div>
                )}
              </div>

              {transferError && (
                <div className="bg-error/10 border border-error/20 p-md rounded-lg text-xs text-error flex items-start gap-xs">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <p>{transferError}</p>
                </div>
              )}

              {/* Informative warning for safety / keeping Fijos intact */}
              {transferType === 'deposit' && parseFloat(transferAmount) > 0 && remainingBalance - parseFloat(transferAmount) < 0 && (
                <div className="bg-error/15 border border-error/30 p-md rounded-lg text-xs text-error flex items-start gap-xs">
                  <span className="material-symbols-outlined text-[18px] shrink-0 animate-pulse">warning</span>
                  <p>
                    <strong>⚠️ Saldo Insuficiente:</strong> Guardar este monto excede tu saldo disponible total.
                  </p>
                </div>
              )}

              <div className="pt-sm flex gap-md justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowTransferModal(false)}
                  className="px-lg py-md border border-outline-variant/30 text-on-surface rounded-lg font-bold hover:bg-white/5 active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 duration-100"
                >
                  {transferType === 'deposit' ? 'Confirmar Ahorro' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
