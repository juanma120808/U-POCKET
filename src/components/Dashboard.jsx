import React, { useState, useEffect } from 'react';

export default function Dashboard({ userProfile, addExpense, totalExpenses, history, changeTheme }) {
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [termometerStatus, setTermometerStatus] = useState('safe');
  
  const remainingBalance = userProfile.initialBalance - totalExpenses;
  const isCritical = remainingBalance < userProfile.fixedExpenses; 

  // Calculate categories
  const fijosTotal = history.filter(h => h.type === 'Fijos').reduce((a, b) => a + b.amount, 0);
  const hormigaTotal = history.filter(h => h.type === 'Hormiga').reduce((a, b) => a + b.amount, 0);
  const ocioTotal = history.filter(h => h.type === 'Ocio').reduce((a, b) => a + b.amount, 0);

  useEffect(() => {
    if (isCritical) {
      setTermometerStatus('critical');
    } else {
      setTermometerStatus('safe');
    }
  }, [remainingBalance, isCritical]);

  const handleAddExpense = (type) => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) return;
    
    addExpense({
      type,
      name: expenseName || type,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString()
    });
    setExpenseAmount('');
    setExpenseName('');
  };

  return (
    <div className="flex flex-col h-100">
      <div className="animate-fade-in flex-1">
        
        {/* Header con Tema */}
        <div className="flex justify-between align-center mb-6">
          <h2 style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>Dashboard</h2>
          <select 
            onChange={(e) => changeTheme(e.target.value)} 
            className="input-field" 
            style={{ width: 'auto', marginBottom: 0, padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="dark">🌙 Dark</option>
            <option value="light">☀️ Light</option>
            <option value="neon">⚡ Neon</option>
          </select>
        </div>

        {/* Panel Superior: Saldo Disponible */}
        <div className="glass-panel text-center mb-6" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 60%)', opacity: 0.1, zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="label">Saldo Disponible</p>
            <h1 className="text-accent tabular-nums" style={{ fontSize: '56px', marginBottom: '8px', textShadow: '0 0 20px rgba(139, 92, 246, 0.3)', lineHeight: 1 }}>
              ${remainingBalance.toLocaleString('es-CO')}
            </h1>
            
            <div style={{ background: 'var(--border-glass)', height: '4px', borderRadius: '2px', marginTop: '24px', overflow: 'hidden' }}>
              <div style={{ 
                background: isCritical ? 'var(--color-danger)' : 'var(--color-safe)', 
                height: '100%', 
                width: `${Math.max(0, Math.min(100, (remainingBalance / userProfile.initialBalance) * 100))}%`,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 10px ${isCritical ? 'var(--color-danger)' : 'var(--color-safe)'}`
              }} />
            </div>
          </div>
        </div>

        {/* Layout de dos columnas para Ingreso vs Stats */}
        <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
          
          {/* Ingreso Rápido */}
          <div className="glass-panel" style={{ flex: '1 1 300px' }}>
            <h3 className="mb-4" style={{ fontSize: '16px' }}>Ingreso Rápido</h3>
            
            <div className="flex flex-col gap-2 mb-4">
              <input 
                type="text" 
                className="input-field mb-0" 
                placeholder="Descripción (opcional)" 
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
              <input 
                type="number" 
                className="input-field tabular-nums mb-0" 
                placeholder="$ Monto" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-accent)' }}
              />
            </div>
            
            <div className="flex justify-between gap-2 mt-4">
              <button className="btn btn-glass" style={{flex: 1, flexDirection: 'column', padding: '12px 4px'}} onClick={() => handleAddExpense('Fijos')}>
                <span style={{fontSize: '20px'}}>🚌</span>
                <span style={{fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Fijo</span>
              </button>
              <button className="btn btn-glass" style={{flex: 1, flexDirection: 'column', padding: '12px 4px'}} onClick={() => handleAddExpense('Hormiga')}>
                <span style={{fontSize: '20px'}}>🐜</span>
                <span style={{fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Hormiga</span>
              </button>
              <button className="btn btn-glass" style={{flex: 1, flexDirection: 'column', padding: '12px 4px'}} onClick={() => handleAddExpense('Ocio')}>
                <span style={{fontSize: '20px'}}>🍿</span>
                <span style={{fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ocio</span>
              </button>
            </div>
          </div>

          {/* Estadísticas Visuales (Donut) */}
          <div className="glass-panel flex flex-col align-center justify-between" style={{ flex: '1 1 300px' }}>
            <h3 className="mb-4 w-100 text-left" style={{ fontSize: '16px', width: '100%' }}>Distribución de Gastos</h3>
            
            <div className="donut-chart mb-4 mt-2">
              <div className="donut-inner">
                <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  ${totalExpenses > 1000 ? (totalExpenses/1000).toFixed(1) + 'k' : totalExpenses}
                </span>
                <p style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Gastado</p>
              </div>
            </div>

            <div className="flex justify-between w-100 gap-4" style={{ width: '100%', fontSize: '12px' }}>
              <div className="text-center">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-support)', margin: '0 auto 4px' }}></div>
                <span className="text-muted">Fijos</span>
                <p className="tabular-nums font-bold">${fijosTotal}</p>
              </div>
              <div className="text-center">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', margin: '0 auto 4px' }}></div>
                <span className="text-muted">Hormiga</span>
                <p className="tabular-nums font-bold">${hormigaTotal}</p>
              </div>
              <div className="text-center">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', margin: '0 auto 4px' }}></div>
                <span className="text-muted">Ocio</span>
                <p className="tabular-nums font-bold">${ocioTotal}</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Termómetro Dinámico */}
        <div 
          className="glass-panel" 
          style={{ 
            borderColor: termometerStatus === 'critical' ? 'var(--color-danger)' : 'var(--border-glass)',
            background: termometerStatus === 'critical' ? 'rgba(255, 180, 171, 0.05)' : 'var(--bg-panel)',
            boxShadow: termometerStatus === 'critical' ? '0 0 20px rgba(255, 180, 171, 0.1)' : 'var(--shadow-glass)'
          }}
        >
          <h4 className="mb-2 flex align-center gap-2" style={{ color: termometerStatus === 'critical' ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
            {termometerStatus === 'critical' ? '⚠️ Riesgo Financiero Detectado' : '✅ Finanzas Estables'}
          </h4>
          <p className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
            {termometerStatus === 'critical' 
              ? 'Atención: Tu saldo actual es inferior a tus gastos fijos planificados. Considera reducir gastos hormiga y ocio para asegurar tus compromisos.' 
              : 'Tus gastos operativos están cubiertos. Mantén este ritmo para asegurar tus fondos de emergencia y metas de ahorro.'}
          </p>
        </div>
      </div>
    </div>
  );
}
