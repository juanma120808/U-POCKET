import React, { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [balance, setBalance] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([{ name: '', amount: '' }]);
  const [savingGoal, setSavingGoal] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalFixed = fixedExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    
    if (balance) {
      onComplete({
        initialBalance: parseFloat(balance),
        fixedExpensesList: fixedExpenses.filter(f => f.name && f.amount),
        fixedExpenses: totalFixed,
        savingGoal: parseFloat(savingGoal) || 0
      });
    }
  };

  return (
    <div className="p-6 flex flex-col justify-between" style={{ minHeight: '100vh' }}>
      <div className="animate-fade-in mt-4">
        <h1 className="mb-2">¡Hola! Vamos a configurar tu U-Pocket</h1>
        <p className="text-muted mb-6">Definamos tu presupuesto para que todo esté bajo control.</p>

        <form onSubmit={handleSubmit} className="glass-panel p-6">
          <label className="label">Saldo disponible para la semana</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="$0.00" 
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
          />

          <label className="label mt-4">Tus Gastos Fijos (ej. Transporte, Almuerzos)</label>
          {fixedExpenses.map((expense, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input 
                type="text" 
                className="input-field mb-0" 
                placeholder="Nombre (ej. Bus)" 
                value={expense.name}
                onChange={(e) => handleFixedChange(index, 'name', e.target.value)}
                required
                style={{ flex: 1, marginBottom: 0 }}
              />
              <input 
                type="number" 
                className="input-field mb-0" 
                placeholder="$0.00" 
                value={expense.amount}
                onChange={(e) => handleFixedChange(index, 'amount', e.target.value)}
                required
                style={{ width: '100px', marginBottom: 0 }}
              />
              {fixedExpenses.length > 1 && (
                <button type="button" className="btn btn-danger" style={{ padding: '0 12px' }} onClick={() => removeFixedExpense(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-glass mb-4" onClick={addFixedExpense} style={{ padding: '8px 12px', fontSize: '13px' }}>
            + Añadir otro gasto fijo
          </button>

          <label className="label mt-4">Meta de ahorro (Opcional)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="$0.00" 
            value={savingGoal}
            onChange={(e) => setSavingGoal(e.target.value)}
          />

          <button type="submit" className="btn btn-primary w-100" style={{ width: '100%', marginTop: '24px' }}>
            Comenzar mi semana 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
