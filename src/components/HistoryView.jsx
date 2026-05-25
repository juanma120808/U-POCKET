import React, { useState } from 'react';
import { db } from '../services/db';

export default function HistoryView({ expenses, addExpense, openTxModal, onEditExpense }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // All, Fixed, Leisure, Minor
  const [dateFilter, setDateFilter] = useState('30'); // 30, 90, 365, All
  const [minAmount, setMinAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Formatting currency helper
  const formatMoney = (val) => `$${parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Filter Logic
  const filteredExpenses = (expenses || []).filter(e => {
    if (!e) return false;
    
    // Safely retrieve properties as strings
    const name = String(e.name || '');
    const details = String(e.details || '');
    const type = String(e.type || '');
    const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0;
    const date = String(e.date || new Date().toISOString());

    // Search filter safely
    const term = String(searchTerm || '').toLowerCase();
    const matchesSearch = 
      name.toLowerCase().includes(term) || 
      details.toLowerCase().includes(term);

    // Category filter
    const matchesCategory = categoryFilter === 'All' ? true : type === categoryFilter;

    // Min Amount filter
    const matchesMinAmount = minAmount === '' ? true : amount >= db.parseFormattedMoney(minAmount);

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const txDate = new Date(date);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - parseInt(dateFilter));
      matchesDate = txDate >= limitDate;
    }

    return matchesSearch && matchesCategory && matchesMinAmount && matchesDate;
  });

  // Pagination Logic
  const totalItems = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    
    // Construct CSV Header and rows
    const headers = ['Fecha', 'Concepto', 'Categoria', 'Monto', 'Detalles'];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString('es-CO'),
      e.name,
      e.type === 'Fixed' ? 'Fijo' : e.type === 'Leisure' ? 'Ocio' : 'Hormiga',
      e.amount,
      e.details || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and trigger download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `U-Pocket_Historial_Gastos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculations for filtered set
  const totalSpentPeriod = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const averageSpent = totalItems > 0 ? (totalSpentPeriod / totalItems) : 0;

  // Calculate most frequent category
  const getMostFrequentCategory = () => {
    if (totalItems === 0) return 'Ninguna';
    const counts = filteredExpenses.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    
    let maxCat = 'Fixed';
    let maxCount = 0;
    Object.keys(counts).forEach(cat => {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        maxCat = cat;
      }
    });

    const mapping = { Fixed: 'Gastos Fijos', Leisure: 'Ocio', Minor: 'Gastos Hormiga' };
    return `${mapping[maxCat]} (${maxCount} tx)`;
  };

  return (
    <div className="space-y-lg animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pb-base border-b border-outline-variant/20">
        <div>
          <h2 className="font-headline-lg text-[28px] md:text-headline-lg font-bold text-on-surface tracking-tight">Historial de Gastos</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Visualiza y filtra tus egresos para un control milimétrico de tu presupuesto.</p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button 
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="flex items-center gap-xs px-md py-sm bg-surface-container border border-outline-variant/30 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            Exportar CSV
          </button>
          <button 
            onClick={openTxModal}
            className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:opacity-90 transition-opacity cursor-pointer active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
        
        {/* Search Bar */}
        <div className="glass-panel p-md rounded-xl space-y-xs flex flex-col justify-between">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Buscar</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Ej. Starbucks, Renta..." 
              className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-xs pl-lg pr-sm text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/30"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="glass-panel p-md rounded-xl space-y-xs flex flex-col justify-between">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Rango de Fecha</label>
          <select 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-xs px-sm text-body-md text-on-surface"
          >
            <option value="30">Últimos 30 Días</option>
            <option value="90">Últimas 12 Semanas</option>
            <option value="365">Este Año</option>
            <option value="All">Histórico Completo</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="glass-panel p-md rounded-xl space-y-xs flex flex-col justify-between">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Categoría</label>
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-xs px-sm text-body-md text-on-surface"
          >
            <option value="All">Todas las Categorías</option>
            <option value="Fixed">Gastos Fijos</option>
            <option value="Leisure">Ocio y Placer</option>
            <option value="Minor">Gasto Hormiga</option>
          </select>
        </div>

        {/* Min Amount Filter */}
        <div className="glass-panel p-md rounded-xl space-y-xs flex flex-col justify-between">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Monto Mínimo</label>
          <div className="relative">
            <span className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant font-mono text-body-md">$</span>
            <input 
              type="text"
              inputMode="decimal"
              value={minAmount}
              onChange={(e) => { setMinAmount(db.normalizeAndFormat(e.target.value)); setCurrentPage(1); }}
              placeholder="0,00" 
              className="w-full bg-[#0A0A0A] border border-outline-variant/30 rounded-lg py-xs pl-md pr-sm text-body-md font-mono text-on-surface"
            />
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="glass-panel rounded-xl overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/40 border-b border-outline-variant/30">
                <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Fecha</th>
                <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Transacción</th>
                <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Categoría</th>
                <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Monto</th>
                <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((tx, idx) => {
                  let iconName = 'shopping_bag';
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
                    catColor = 'secondary';
                    iconColor = 'text-secondary';
                    labelText = 'Hormiga';
                  }

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => onEditExpense && onEditExpense(tx)}
                      className="row-hover hover:bg-white/[0.02] transition-all duration-150 cursor-pointer"
                    >
                      <td className="px-lg py-md font-mono text-xs text-on-surface-variant">
                        {new Date(tx.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
                            <span className={`material-symbols-outlined ${iconColor}`}>{iconName}</span>
                          </div>
                          <div>
                            <p className="font-body-md text-body-md font-semibold text-on-surface">{tx.name}</p>
                            <p className="font-label-md text-[11px] text-on-surface-variant">{tx.details}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <span className={`px-sm py-xs rounded-full border border-${catColor}/30 bg-${catColor}/10 text-${catColor} text-[10px] font-bold uppercase tracking-wider`}>
                          {labelText}
                        </span>
                      </td>
                      <td className="px-lg py-md text-right font-mono text-body-lg text-primary font-bold">
                        -{formatMoney(tx.amount)}
                      </td>
                      <td className="px-lg py-md text-center">
                        <div className="flex items-center justify-center gap-sm">
                          <div className="inline-flex items-center gap-xs px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-bold text-green-500 uppercase">Liquidado</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditExpense && onEditExpense(tx); }}
                            className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-white/10 transition-colors flex items-center justify-center border border-outline-variant/10 active:scale-90"
                            title="Editar Gasto"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-lg py-16 text-center text-on-surface-variant font-body-md">
                    <span className="material-symbols-outlined text-[44px] text-on-surface-variant/40 block mb-sm">search_off</span>
                    No se encontraron gastos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <div className="px-lg py-md flex flex-col sm:flex-row items-center justify-between gap-md border-t border-outline-variant/20 bg-surface-container-low/30">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} gastos filtrados
          </p>
          
          <div className="flex items-center gap-sm">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-xs rounded-md border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-on-surface-variant active:scale-95 duration-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => handlePageChange(pg)}
                className={`font-label-md text-label-md font-bold px-sm py-1 rounded transition-colors ${
                  currentPage === pg 
                    ? 'text-primary bg-primary/10' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {pg}
              </button>
            ))}

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-xs rounded-md border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-on-surface-variant active:scale-95 duration-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        
        {/* Total Spent period */}
        <div className="glass-panel p-lg rounded-xl relative overflow-hidden group border border-outline-variant/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase mb-xs font-bold">Total Gastado Filtrado</h4>
          <p className="font-headline-lg text-[22px] md:text-headline-lg font-bold text-on-surface font-mono">{formatMoney(totalSpentPeriod)}</p>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant text-xs leading-relaxed">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Suma de transacciones visibles</span>
          </div>
        </div>

        {/* Most Frequent Category */}
        <div className="glass-panel p-lg rounded-xl relative overflow-hidden group border border-outline-variant/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary opacity-50"></div>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase mb-xs font-bold">Categoría Más Frecuente</h4>
          <p className="font-headline-lg text-[22px] md:text-headline-lg font-bold text-on-surface">{getMostFrequentCategory()}</p>
          <p className="text-xs text-on-surface-variant mt-md">Según el filtro actual</p>
        </div>

        {/* Average Transaction */}
        <div className="glass-panel p-lg rounded-xl relative overflow-hidden group border border-outline-variant/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-50"></div>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase mb-xs font-bold">Transacción Promedio</h4>
          <p className="font-headline-lg text-[22px] md:text-headline-lg font-bold text-on-surface font-mono">{formatMoney(averageSpent)}</p>
          <p className="text-xs text-on-surface-variant mt-md">Estabilidad financiera: Alta</p>
        </div>

      </div>

    </div>
  );
}
