import React from 'react';

export default function ProgressView({ 
  expenses, 
  userProfile, 
  isCritical, 
  remainingBalance, 
  onBack 
}) {
  // Aggregate category sums
  const fixedTotal = expenses.filter(e => e.type === 'Fixed').reduce((acc, curr) => acc + curr.amount, 0);
  const leisureTotal = expenses.filter(e => e.type === 'Leisure').reduce((acc, curr) => acc + curr.amount, 0);
  const minorTotal = expenses.filter(e => e.type === 'Minor').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpent = fixedTotal + leisureTotal + minorTotal;

  // Calculate percentages
  const totalSpentOr1 = totalSpent || 1;
  const fixedPercent = Math.round((fixedTotal / totalSpentOr1) * 100);
  const leisurePercent = Math.round((leisureTotal / totalSpentOr1) * 100);
  const minorPercent = Math.round((minorTotal / totalSpentOr1) * 100);

  // Formatting currency helper
  const formatMoney = (val) => `$${parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // SVG Circumference = 2 * PI * r = 2 * 3.14159 * 80 = 502.65
  const circ = 502.65;
  const fixedOffset = 0;
  const leisureOffset = -((fixedTotal / totalSpentOr1) * circ);
  const minorOffset = -(((fixedTotal + leisureTotal) / totalSpentOr1) * circ);

  // Spend Efficiency score (0 to 10 scale)
  const efficiencyScore = userProfile.initialBalance > 0 
    ? Math.max(0, Math.min(10, parseFloat(((remainingBalance / userProfile.initialBalance) * 10).toFixed(1))))
    : 0;

  // Weekly savings estimate (uses the user's declared weekly savings goal, or a 20% estimated saving rate from their remaining budget as fallback)
  const weeklySaving = parseFloat(userProfile.savingGoal) > 0 
    ? parseFloat(userProfile.savingGoal) 
    : (remainingBalance > 0 ? remainingBalance * 0.2 : 0);

  // Proyectar el ahorro semanal a un año completo (52 semanas)
  const annualProjection = weeklySaving * 52;

  // Mock bar height calculations
  // Jun Real height: (totalSpent / initialBalance) * 80. Max 100.
  const junMetaVal = userProfile.initialBalance;
  const junRealVal = totalSpent;
  const junRatio = junMetaVal > 0 ? Math.min(100, (junRealVal / junMetaVal) * 80) : 0;

  return (
    <div className="space-y-lg animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md pb-base border-b border-outline-variant/20">
        <div>
          <h2 className="font-headline-lg text-[28px] md:text-headline-lg font-bold text-on-surface tracking-tight">Estadísticas y Progreso</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Análisis detallado de tu salud financiera este trimestre.</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-xs px-md py-sm bg-surface-container border border-outline-variant/30 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant/50 transition-colors active:scale-95 duration-100 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al Dashboard
        </button>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Comparativa Mensual (Bento Card Large - span 2) */}
        <section className="lg:col-span-2 glass-card p-lg border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-xl">
              <div>
                <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Comparativa Mensual</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Gastos reales vs Presupuesto asignado semanal/mensual</p>
              </div>
              <div className="flex gap-sm">
                <span className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
                  <span className="w-3 h-3 rounded-full bg-primary"></span> Gastado Real
                </span>
                <span className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
                  <span className="w-3 h-3 rounded-full bg-surface-variant"></span> Presupuesto Asignado
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar -mx-lg px-lg">
              <div className="min-w-[500px] md:min-w-0 h-[280px] flex items-end justify-between gap-sm md:gap-md px-md pb-xl relative mt-lg">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between border-b border-outline-variant/10 py-md pointer-events-none">
                  <div className="border-b border-outline-variant/10 w-full"></div>
                  <div className="border-b border-outline-variant/10 w-full"></div>
                  <div className="border-b border-outline-variant/10 w-full"></div>
                </div>

                {/* Bar Groups */}
                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full relative">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title="Presupuesto: $2,000"></div>
                    <div className="w-6 md:w-8 bg-primary-container rounded-t-sm h-[60%] hover:brightness-110 transition-all" title="Gastado: $1,800"></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[11px]">Ene</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title="Presupuesto: $2,000"></div>
                    <div className="w-6 md:w-8 bg-primary-container rounded-t-sm h-[50%] hover:brightness-110 transition-all" title="Gastado: $1,420"></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[11px]">Feb</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title="Presupuesto: $2,000"></div>
                    <div className="w-6 md:w-8 bg-primary-container rounded-t-sm h-[82%] hover:brightness-110 transition-all" title="Gastado: $2,350 (Sobre presupuesto)"></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[11px]">Mar</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title="Presupuesto: $2,000"></div>
                    <div className="w-6 md:w-8 bg-primary-container rounded-t-sm h-[40%] hover:brightness-110 transition-all" title="Gastado: $1,150"></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[11px]">Abr</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title="Presupuesto: $2,000"></div>
                    <div className="w-6 md:w-8 bg-primary-container rounded-t-sm h-[65%] hover:brightness-110 transition-all" title="Gastado: $1,850"></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[11px]">May</span>
                </div>

                {/* Current dynamic month (Jun) */}
                <div className="flex-1 flex flex-col items-center gap-sm group">
                  <div className="w-full flex items-end justify-center gap-xs h-full">
                    <div className="w-3 md:w-4 bg-surface-variant rounded-t-sm h-[70%]" title={`Presupuesto Inicial: ${formatMoney(junMetaVal)}`}></div>
                    <div 
                      className={`w-6 md:w-8 rounded-t-sm hover:brightness-110 transition-all ${
                        isCritical ? 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.4)]' : 'bg-primary shadow-[0_0_10px_rgba(208,188,255,0.4)]'
                      }`}
                      style={{ height: `${Math.max(8, junRatio)}%` }} 
                      title={`Gastado Actual (Jun): ${formatMoney(junRealVal)}`}
                    ></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-bold text-[11px] underline">Jun (Act)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Donut Chart Category Breakdown (Bento Card Small - span 1) */}
        <section className="glass-card p-lg border border-outline-variant/20 flex flex-col">
          <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-lg">Distribución Trimestre</h3>
          
          <div className="flex-1 flex items-center justify-center relative py-md">
            {totalSpent > 0 ? (
              <svg className="w-48 h-48 transform -rotate-90">
                {/* Background Circle */}
                <circle className="text-surface-variant/20" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12"></circle>
                
                {/* Fixed (Purple) */}
                {fixedTotal > 0 && (
                  <circle 
                    className="donut-segment transition-all duration-1000" 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="80" 
                    stroke="#d0bcff" 
                    strokeWidth="14" 
                    strokeDasharray={`${(fixedTotal/totalSpentOr1)*circ} ${circ}`} 
                    strokeDashoffset={fixedOffset}
                  ></circle>
                )}

                {/* Leisure (Blue) */}
                {leisureTotal > 0 && (
                  <circle 
                    className="donut-segment transition-all duration-1000" 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="80" 
                    stroke="#4cd7f6" 
                    strokeWidth="14" 
                    strokeDasharray={`${(leisureTotal/totalSpentOr1)*circ} ${circ}`} 
                    strokeDashoffset={leisureOffset}
                  ></circle>
                )}

                {/* Hormiga (Red/Pink) */}
                {minorTotal > 0 && (
                  <circle 
                    className="donut-segment transition-all duration-1000" 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="80" 
                    stroke="#ffb4ab" 
                    strokeWidth="14" 
                    strokeDasharray={`${(minorTotal/totalSpentOr1)*circ} ${circ}`} 
                    strokeDashoffset={minorOffset}
                  ></circle>
                )}
              </svg>
            ) : (
              <div className="w-40 h-40 rounded-full border-4 border-dashed border-outline-variant/30 flex items-center justify-center">
                <span className="text-xs text-on-surface-variant font-bold">Sin Datos</span>
              </div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-headline-lg text-on-surface font-bold">
                {totalSpent > 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : `$${totalSpent.toFixed(0)}`}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">Total Mes</span>
            </div>
          </div>

          <div className="mt-lg space-y-md">
            <div className="flex justify-between items-center p-md bg-surface-container rounded-lg border border-outline-variant/10">
              <div className="flex items-center gap-md">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">Gastos Fijos</span>
              </div>
              <span className="font-mono text-body-md text-on-surface font-bold">{fixedPercent}%</span>
            </div>
            
            <div className="flex justify-between items-center p-md bg-surface-container rounded-lg border border-outline-variant/10">
              <div className="flex items-center gap-md">
                <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">Ocio y Placer</span>
              </div>
              <span className="font-mono text-body-md text-on-surface font-bold">{leisurePercent}%</span>
            </div>
            
            <div className="flex justify-between items-center p-md bg-surface-container rounded-lg border border-outline-variant/10">
              <div className="flex items-center gap-md">
                <span className="w-3 h-3 rounded-full bg-error"></span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">Gastos Hormiga</span>
              </div>
              <span className="font-mono text-body-md text-on-surface font-bold">{minorPercent}%</span>
            </div>
          </div>
        </section>

      </div>

      {/* Bento Bottom: Smart Insights */}
      <section className="glass-card p-lg border border-outline-variant/20">
        <div className="flex items-center gap-md mb-lg">
          <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Financial Insights (Smart Updates)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          
          {/* Card 1: Optimization */}
          <div className="p-lg rounded-xl bg-primary-container/10 border border-primary/20 flex flex-col justify-between gap-sm">
            <div>
              <div className="flex justify-between items-center mb-sm">
                <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Optimización</span>
                <span className="material-symbols-outlined text-primary text-body-lg">trending_down</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {minorTotal > 0 
                  ? `Has gastado ${formatMoney(minorTotal)} en gastos hormiga. Reducirlos en un 15% liberaría ${formatMoney(minorTotal * 0.15)} adicionales para tus metas de ahorro.`
                  : '¡Espectacular! Tus gastos hormiga están en $0.00. Mantener este control te dará una tremenda ventaja para invertir.'}
              </p>
            </div>
            <button className="mt-md text-primary font-label-md text-label-md flex items-center gap-xs hover:underline font-bold self-start">
              Plan de optimización <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* Card 2: Investment */}
          <div className="p-lg rounded-xl bg-tertiary-container/10 border border-tertiary/20 flex flex-col justify-between gap-sm">
            <div>
              <div className="flex justify-between items-center mb-sm">
                <span className="font-label-md text-label-md text-tertiary font-bold uppercase tracking-wider">Inversión / Metas</span>
                <span className="material-symbols-outlined text-tertiary text-body-lg">account_balance_wallet</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed font-mono">
                {remainingBalance > 0
                  ? `Tu saldo disponible es de ${formatMoney(remainingBalance)}. Te sugerimos depositar ${formatMoney(remainingBalance * 0.3)} (30%) en tus Bolsillos de Ahorro.`
                  : 'Actualmente no cuentas con saldo remanente libre para depositar. Espera al inicio del próximo ciclo para destinar ahorros.'}
              </p>
            </div>
            <button className="mt-md text-tertiary font-label-md text-label-md flex items-center gap-xs hover:underline font-bold self-start">
              Gestionar Bolsillos <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* Card 3: Alert */}
          <div className={`p-lg rounded-xl border flex flex-col justify-between gap-sm ${
            isCritical 
              ? 'bg-error-container/10 border-error/20 text-on-error-container' 
              : 'bg-surface-container border-outline-variant/10'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-sm">
                <span className={`font-label-md text-label-md font-bold uppercase tracking-wider ${
                  isCritical ? 'text-error' : 'text-on-surface-variant'
                }`}>
                  {isCritical ? 'Alerta Crítica' : 'Salud de Operación'}
                </span>
                <span className={`material-symbols-outlined text-body-lg ${isCritical ? 'text-error animate-pulse' : 'text-primary'}`}>
                  {isCritical ? 'warning' : 'check_circle'}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {isCritical 
                  ? `Tu saldo restante está por debajo de tus gastos fijos obligatorios (${formatMoney(userProfile.fixedExpenses)}). ¡Evita gastos no indispensables!` 
                  : `Tus gastos fijos obligatorios de ${formatMoney(userProfile.fixedExpenses)} están 100% protegidos e intactos. Cobertura del saldo: Excelente.`}
              </p>
            </div>
            <span className="text-xs text-on-surface-variant mt-sm block">U-Pocket Engine V2</span>
          </div>

        </div>
      </section>

      {/* Mini Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="glass-card p-lg flex items-center gap-lg border border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Ahorro Promedio Semanal</p>
            <h4 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
              {formatMoney(weeklySaving)}
            </h4>
          </div>
        </div>

        <div className="glass-card p-lg flex items-center gap-lg border border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Eficiencia de Gasto</p>
            <h4 className="font-headline-md text-headline-md font-bold text-on-surface">{efficiencyScore} / 10</h4>
          </div>
        </div>

        <div className="glass-card p-lg flex items-center gap-lg border border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined">show_chart</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Proyección de Ahorro Anual</p>
            <h4 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">{formatMoney(annualProjection)}</h4>
          </div>
        </div>
      </section>

    </div>
  );
}
