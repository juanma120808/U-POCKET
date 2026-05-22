import React from 'react';

export default function Dashboard({ 
  userProfile, 
  expenses, 
  remainingBalance, 
  isCritical, 
  openTxModal, 
  openFundsModal, 
  pockets, 
  setActiveTab 
}) {
  // Aggregate category sums
  const fixedTotal = expenses.filter(e => e.type === 'Fixed').reduce((acc, curr) => acc + curr.amount, 0);
  const leisureTotal = expenses.filter(e => e.type === 'Leisure').reduce((acc, curr) => acc + curr.amount, 0);
  const minorTotal = expenses.filter(e => e.type === 'Minor').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpent = fixedTotal + leisureTotal + minorTotal;

  // Calculate percentages for categories
  const fixedPercent = totalSpent > 0 ? Math.round((fixedTotal / totalSpent) * 100) : 0;
  const leisurePercent = totalSpent > 0 ? Math.round((leisureTotal / totalSpent) * 100) : 0;
  const minorPercent = totalSpent > 0 ? Math.round((minorTotal / totalSpent) * 100) : 0;

  // Aggregate pocket progress
  const totalSaved = pockets.reduce((acc, p) => acc + p.currentAmount, 0);
  const totalTarget = pockets.reduce((acc, p) => acc + p.targetAmount, 0);
  const savingGoalPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const savingRemaining = Math.max(0, totalTarget - totalSaved);

  // Formatting currency helper
  const formatMoney = (val) => `$${parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Slice the 4 most recent expenses
  const recentExpenses = expenses.slice(0, 4);

  // SVG dash offset calculation helper
  // Circumference = 2 * PI * r = 2 * 3.14159 * 20 = 125.66
  const getStrokeDashOffset = (percentage) => {
    const r = 20;
    const circ = 2 * Math.PI * r;
    return circ - (Math.min(percentage, 100) / 100) * circ;
  };

  return (
    <div className="space-y-lg animate-fade-in">
      
      {/* 1. Hero Section: Available Balance */}
      <section className="relative">
        <div className="glass-card p-lg md:p-xl rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg relative z-10">
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-xs block">Saldo Disponible</span>
              <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight font-bold font-mono">
                {formatMoney(remainingBalance)}
              </h2>
              <div className="flex items-center gap-sm mt-sm">
                <span className={`flex items-center gap-xs font-label-md text-label-md px-sm py-xs rounded border ${
                  isCritical 
                    ? 'text-error bg-error/10 border-error/20' 
                    : 'text-tertiary bg-tertiary/10 border-tertiary/20'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {isCritical ? 'warning' : 'trending_flat'}
                  </span>
                  {isCritical ? 'Fijos en Riesgo' : 'Presupuesto Seguro'}
                </span>
                <span className="text-on-surface-variant font-body-md text-body-md">
                  {isCritical 
                    ? `¡Gastos fijos superan tu saldo en ${formatMoney(Math.abs(remainingBalance - userProfile.fixedExpenses))}!` 
                    : `Gastos fijos de ${formatMoney(userProfile.fixedExpenses)} protegidos`}
                </span>
              </div>
            </div>
            
            <div className="flex gap-md shrink-0">
              <button 
                onClick={openFundsModal}
                className="bg-primary text-on-primary font-label-md text-label-md px-lg py-md rounded-lg font-bold hover:shadow-[0_0_20px_rgba(208,188,255,0.4)] transition-all active:scale-[0.98]"
              >
                Ajustar Presupuesto
              </button>
              <button 
                onClick={openTxModal}
                className="border border-outline-variant/30 text-on-surface hover:bg-white/5 font-label-md text-label-md px-lg py-md rounded-lg font-bold transition-all active:scale-[0.98]"
              >
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Left Column: Recent Transactions (Span 2) */}
        <div className="lg:col-span-2 space-y-lg">
          <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full border border-outline-variant/20">
            <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest/30">
              <h3 className="font-headline-md text-headline-md font-semibold flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Gastos Recientes
              </h3>
              <button 
                onClick={() => setActiveTab('history')}
                className="text-primary font-label-md text-label-md hover:underline font-bold transition-all"
              >
                Ver Historial
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/40">
                  <tr className="border-b border-outline-variant/20">
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Concepto / Entidad</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Categoría</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentExpenses.length > 0 ? (
                    recentExpenses.map((tx, idx) => {
                      // Styling variables based on category
                      let iconName = 'shopping_cart';
                      let catColor = 'secondary';
                      let iconColor = 'text-primary';
                      let labelText = 'Fijo';

                      if (tx.type === 'Leisure') {
                        iconName = 'movie';
                        catColor = 'tertiary';
                        iconColor = 'text-tertiary';
                        labelText = 'Ocio';
                      } else if (tx.type === 'Minor') {
                        iconName = 'coffee';
                        catColor = 'outline';
                        iconColor = 'text-outline';
                        labelText = 'Hormiga';
                      }

                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-md">
                              <div className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/20 group-hover:border-primary/40 transition-colors">
                                <span className={`material-symbols-outlined ${iconColor}`}>{iconName}</span>
                              </div>
                              <div>
                                <p className="font-body-md text-body-md font-semibold text-on-surface">{tx.name}</p>
                                <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{tx.details}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-lg py-md">
                            <span className={`px-sm py-xs bg-${catColor}/10 text-${catColor} border border-${catColor}/20 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                              {labelText}
                            </span>
                          </td>
                          <td className="px-lg py-md font-data-tabular text-on-surface-variant text-xs">
                            {new Date(tx.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-lg py-md text-right font-mono font-bold text-error">
                            -{formatMoney(tx.amount)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-lg py-12 text-center text-on-surface-variant font-body-md">
                        <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 block mb-sm">database</span>
                        No hay gastos registrados en esta semana.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Spending Analytics & Savings (Span 1) */}
        <div className="space-y-lg">
          
          {/* Spending Analytics Bento Card */}
          <div className="glass-card p-lg rounded-xl flex flex-col border border-outline-variant/20">
            <h3 className="font-headline-md text-headline-md font-semibold mb-lg flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Distribución de Gastos
            </h3>
            
            <div className="space-y-md">
              {/* Fixed Expenses Row */}
              <div className="flex items-center justify-between p-md bg-white/[0.02] rounded-lg border border-outline-variant/10 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-md">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-outline-variant/20" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                      <circle 
                        className="text-secondary transition-all duration-1000" 
                        cx="24" 
                        cy="24" 
                        fill="transparent" 
                        r="20" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 20} 
                        strokeDashoffset={getStrokeDashOffset(fixedPercent)}
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-on-surface">{fixedPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-semibold text-on-surface">Gastos Fijos</p>
                    <p className="text-xs text-on-surface-variant font-mono">{formatMoney(fixedTotal)}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">commute</span>
              </div>

              {/* Leisure Row */}
              <div className="flex items-center justify-between p-md bg-white/[0.02] rounded-lg border border-outline-variant/10 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-md">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-outline-variant/20" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                      <circle 
                        className="text-tertiary transition-all duration-1000" 
                        cx="24" 
                        cy="24" 
                        fill="transparent" 
                        r="20" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 20} 
                        strokeDashoffset={getStrokeDashOffset(leisurePercent)}
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-on-surface">{leisurePercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-semibold text-on-surface">Gastos de Ocio</p>
                    <p className="text-xs text-on-surface-variant font-mono">{formatMoney(leisureTotal)}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">movie</span>
              </div>

              {/* Minor/Hormiga Row */}
              <div className="flex items-center justify-between p-md bg-white/[0.02] rounded-lg border border-outline-variant/10 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-md">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-outline-variant/20" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                      <circle 
                        className="text-outline transition-all duration-1000" 
                        cx="24" 
                        cy="24" 
                        fill="transparent" 
                        r="20" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 20} 
                        strokeDashoffset={getStrokeDashOffset(minorPercent)}
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-on-surface">{minorPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-semibold text-on-surface">Gastos Hormiga</p>
                    <p className="text-xs text-on-surface-variant font-mono">{formatMoney(minorTotal)}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">coffee</span>
              </div>
            </div>

            {/* Savings Goal Progress */}
            <div className="mt-xl pt-lg border-t border-outline-variant/10">
              <div 
                className="flex justify-between items-center mb-md cursor-pointer hover:opacity-80"
                onClick={() => setActiveTab('pockets')}
              >
                <h4 className="font-label-md text-label-md uppercase text-on-surface-variant font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">savings</span>
                  Meta Global Ahorros
                </h4>
                <span className="text-primary font-bold font-mono">{savingGoalPercent}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full progress-bar-glow transition-all duration-1000"
                  style={{ width: `${savingGoalPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant mt-md leading-relaxed">
                {savingRemaining > 0 
                  ? `Faltan ${formatMoney(savingRemaining)} para alcanzar tus metas de ahorro.` 
                  : '¡Felicitaciones! Has completado tus metas de ahorro actuales.'}
              </p>
            </div>
          </div>

          {/* Dynamic Smart Insights Status Card */}
          <div 
            className={`glass-card p-lg rounded-xl border relative overflow-hidden flex flex-col justify-between h-48 group cursor-pointer ${
              isCritical 
                ? 'border-error/40 bg-error/5 hover:bg-error/10' 
                : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
            }`}
            onClick={() => setActiveTab('progress')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px]"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className={`font-label-md text-label-md uppercase tracking-wider font-bold block mb-xs ${
                  isCritical ? 'text-error' : 'text-primary'
                }`}>
                  {isCritical ? 'Alerta de Riesgo' : 'Smart Insights'}
                </span>
                <h4 className="font-headline-md text-white font-bold leading-tight">
                  {isCritical ? 'Presupuesto Fijo Comprometido' : '¡Excelente Salud Financiera!'}
                </h4>
              </div>
              <span className={`material-symbols-outlined text-[26px] ${isCritical ? 'text-error animate-pulse' : 'text-primary'}`}>
                {isCritical ? 'warning' : 'auto_awesome'}
              </span>
            </div>
            
            <p className="font-body-md text-body-md text-white/70 relative z-10 leading-relaxed line-clamp-3">
              {isCritical 
                ? `Tu saldo disponible es menor que tus gastos fijos. Evita gastos hormiga (como cafés o snacks) para proteger tu renta y servicios obligatorios.` 
                : `¡Vas por excelente camino! Tus gastos fijos están protegidos. Has mantenido los gastos menores bajo control esta semana.`}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
