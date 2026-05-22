import React, { useState } from 'react';

export default function HistoryView({ history }) {
  const [filter, setFilter] = useState('all');

  // Simple filter logic
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'fijos') return item.type === 'Fijos';
    if (filter === 'hormiga') return item.type === 'Hormiga';
    if (filter === 'ocio') return item.type === 'Ocio';
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} - ${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col h-100">
      <div className="animate-fade-in flex-1">
        <h2 className="mb-4" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>Historial de Gastos</h2>

        {/* Filters */}
        <div className="flex gap-2 mb-6" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`btn ${filter === 'fijos' ? 'btn-support' : 'btn-ghost'}`} 
            style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('fijos')}
          >
            🚌 Fijos
          </button>
          <button 
            className={`btn ${filter === 'hormiga' ? 'btn-danger' : 'btn-ghost'}`} 
            style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('hormiga')}
          >
            🐜 Hormiga
          </button>
          <button 
            className={`btn ${filter === 'ocio' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('ocio')}
          >
            🍿 Ocio
          </button>
        </div>

        {/* History Table */}
        <div className="glass-panel" style={{ overflow: 'hidden', padding: '0' }}>
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-muted">
              No hay transacciones registradas.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', padding: '16px 24px' }}>
              <table style={{ minWidth: '400px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Fecha</th>
                    <th>Detalle</th>
                    <th style={{ width: '100px' }}>Categoría</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, index) => (
                    <tr key={index}>
                      <td className="text-muted tabular-nums" style={{ fontSize: '13px' }}>
                        {formatDate(item.date)}
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                        {item.name}
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          background: item.type === 'Fijos' ? 'rgba(6, 182, 212, 0.1)' : 
                                      item.type === 'Hormiga' ? 'rgba(255, 180, 171, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                          color: item.type === 'Fijos' ? 'var(--color-support)' : 
                                 item.type === 'Hormiga' ? 'var(--color-danger)' : 'var(--color-accent)',
                          fontWeight: '600',
                          border: `1px solid ${
                            item.type === 'Fijos' ? 'rgba(6, 182, 212, 0.2)' : 
                            item.type === 'Hormiga' ? 'rgba(255, 180, 171, 0.2)' : 'rgba(139, 92, 246, 0.2)'
                          }`
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: '600' }}>
                        ${item.amount.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
