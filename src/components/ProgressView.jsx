import React from 'react';

export default function ProgressView({ history, onBack }) {
  // Aggregate expenses by type
  const aggregated = history.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
    return acc;
  }, { Fijos: 0, Hormiga: 0, Ocio: 0 });

  const total = aggregated.Fijos + aggregated.Hormiga + aggregated.Ocio;
  
  // Calculate percentages
  const getPercentage = (amount) => total === 0 ? 0 : Math.round((amount / total) * 100);

  return (
    <div className="p-6 flex flex-col justify-between" style={{ minHeight: '100vh' }}>
      <div className="animate-fade-in mt-4">
        <div className="flex justify-between align-center mb-6">
          <h2>Tu Progreso</h2>
          <button className="btn btn-glass" style={{ padding: '8px 16px', borderRadius: '8px' }} onClick={onBack}>
            Volver
          </button>
        </div>

        <div className="glass-panel p-6 mb-6">
          <h3 className="mb-4">Resumen Semanal</h3>
          
          {/* Custom Bar Chart */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Fijos (🚌)</span>
              <span>${aggregated.Fijos.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-support)', height: '100%', width: `${getPercentage(aggregated.Fijos)}%` }} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Hormiga (🐜)</span>
              <span>${aggregated.Hormiga.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-danger)', height: '100%', width: `${getPercentage(aggregated.Hormiga)}%` }} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Ocio (🍿)</span>
              <span>${aggregated.Ocio.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-accent)', height: '100%', width: `${getPercentage(aggregated.Ocio)}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="mb-4 text-accent">¡Vas por buen camino!</h3>
          <p className="text-muted" style={{ lineHeight: '1.6' }}>
            Mantener controlados tus gastos hormiga es la clave para cumplir tu meta de ahorro. Esta semana has mantenido la simplicidad y te has enfocado en lo esencial.
          </p>
        </div>
      </div>
    </div>
  );
}
