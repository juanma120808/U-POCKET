import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration from environment variables (e.g. Vercel) or localStorage (user input)
let cloudUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('upocket_supabase_url') || '';
let cloudKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('upocket_supabase_key') || '';

let supabase = null;

const initSupabaseClient = (url, key) => {
  if (url && key) {
    try {
      supabase = createClient(url, key, {
        auth: { persistSession: false }
      });
      return true;
    } catch (e) {
      console.error('Error al inicializar Supabase:', e);
      supabase = null;
      return false;
    }
  }
  supabase = null;
  return false;
};

// Initialize on startup
initSupabaseClient(cloudUrl, cloudKey);

export const db = {
  // Check if cloud sync is fully active
  isCloudActive: () => {
    return !!supabase;
  },

  // Get current cloud config keys
  getCloudConfig: () => {
    return { url: cloudUrl, key: cloudKey };
  },

  // Enable/Update Supabase cloud config
  setCloudConfig: async (url, key) => {
    const success = initSupabaseClient(url, key);
    if (success) {
      cloudUrl = url;
      cloudKey = key;
      localStorage.setItem('upocket_supabase_url', url);
      localStorage.setItem('upocket_supabase_key', key);
      
      // Attempt to sync local data to the cloud when switching
      try {
        await db.syncLocalToCloud();
      } catch (err) {
        console.warn('Sincronización inicial fallida. Continuando...', err);
      }
      return true;
    }
    return false;
  },

  // Disable Cloud sync and return to Local Mode
  clearCloudConfig: () => {
    supabase = null;
    cloudUrl = '';
    cloudKey = '';
    localStorage.removeItem('upocket_supabase_url');
    localStorage.removeItem('upocket_supabase_key');
  },

  // ==========================================
  // USERS MANAGEMENT
  // ==========================================

  // Get all registered users
  getUsers: async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from('upocket_users')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error obteniendo usuarios de Supabase:', error);
        return db.getLocalUsers();
      }
      return data.map(u => ({
        email: u.email,
        name: u.name,
        password: u.password,
        initialBalance: parseFloat(u.initial_balance),
        fixedExpensesList: typeof u.fixed_expenses_list === 'string' ? JSON.parse(u.fixed_expenses_list) : u.fixed_expenses_list,
        fixedExpenses: parseFloat(u.fixed_expenses),
        savingGoal: parseFloat(u.saving_goal),
        theme: u.theme
      }));
    } else {
      return db.getLocalUsers();
    }
  },

  getLocalUsers: () => {
    const saved = localStorage.getItem('upocket_users_db');
    return saved ? JSON.parse(saved) : [];
  },

  // Register a new profile
  registerUser: async (profile) => {
    // 1. Always save locally as backup/local profile list
    const localUsers = db.getLocalUsers();
    // Check if email already exists locally
    const filtered = localUsers.filter(u => u.email.toLowerCase() !== profile.email.toLowerCase());
    const updatedLocal = [...filtered, profile];
    localStorage.setItem('upocket_users_db', JSON.stringify(updatedLocal));

    // 2. Cloud Mode Sync
    if (supabase) {
      const { error } = await supabase
        .from('upocket_users')
        .upsert({
          email: profile.email.toLowerCase(),
          name: profile.name,
          password: profile.password,
          initial_balance: profile.initialBalance,
          fixed_expenses_list: profile.fixedExpensesList,
          fixed_expenses: profile.fixedExpenses,
          saving_goal: profile.savingGoal,
          theme: profile.theme || 'dark'
        });
      if (error) {
        console.error('Error registrando usuario en Supabase:', error);
        throw error;
      }
    }
    return profile;
  },

  // Update user profile properties (like initials balance or theme)
  updateUserProfile: async (email, updatedProfile) => {
    const localUsers = db.getLocalUsers();
    const updatedLocal = localUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, ...updatedProfile };
      }
      return u;
    });
    localStorage.setItem('upocket_users_db', JSON.stringify(updatedLocal));

    if (supabase) {
      const { error } = await supabase
        .from('upocket_users')
        .update({
          name: updatedProfile.name,
          password: updatedProfile.password,
          initial_balance: updatedProfile.initialBalance,
          fixed_expenses_list: updatedProfile.fixedExpensesList,
          fixed_expenses: updatedProfile.fixedExpenses,
          saving_goal: updatedProfile.savingGoal,
          theme: updatedProfile.theme
        })
        .eq('email', email.toLowerCase());
      if (error) {
        console.error('Error actualizando perfil en Supabase:', error);
        throw error;
      }
    }
  },

  // ==========================================
  // EXPENSES MANAGEMENT
  // ==========================================

  getExpenses: async (email) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('upocket_expenses')
        .select('*')
        .eq('user_email', email.toLowerCase())
        .order('date', { ascending: false });
      if (error) {
        console.error('Error cargando gastos de Supabase:', error);
        return db.getLocalExpenses(email);
      }
      return data.map(e => ({
        name: e.name,
        amount: parseFloat(e.amount),
        type: e.type,
        date: e.date,
        details: e.details
      }));
    } else {
      return db.getLocalExpenses(email);
    }
  },

  getLocalExpenses: (email) => {
    const key = `upocket_expenses_${email.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  saveExpense: async (email, expense) => {
    // 1. Save Locally
    const key = `upocket_expenses_${email.toLowerCase()}`;
    const localExps = db.getLocalExpenses(email);
    const updatedLocal = [expense, ...localExps];
    localStorage.setItem(key, JSON.stringify(updatedLocal));

    // 2. Cloud Mode Sync
    if (supabase) {
      const { error } = await supabase
        .from('upocket_expenses')
        .insert({
          user_email: email.toLowerCase(),
          name: expense.name,
          amount: expense.amount,
          type: expense.type,
          details: expense.details,
          date: expense.date
        });
      if (error) {
        console.error('Error insertando gasto en Supabase:', error);
        throw error;
      }
    }
    return updatedLocal;
  },

  // ==========================================
  // POCKETS MANAGEMENT
  // ==========================================

  getPockets: async (email) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('upocket_pockets')
        .select('*')
        .eq('user_email', email.toLowerCase());
      if (error) {
        console.error('Error cargando bolsillos de Supabase:', error);
        return db.getLocalPockets(email);
      }
      return data.map(p => ({
        id: p.id,
        name: p.name,
        targetAmount: parseFloat(p.target_amount),
        currentAmount: parseFloat(p.current_amount),
        category: p.category,
        date: p.date,
        icon: p.icon
      }));
    } else {
      return db.getLocalPockets(email);
    }
  },

  getLocalPockets: (email) => {
    const key = `upocket_pockets_${email.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  savePockets: async (email, pockets) => {
    // 1. Save Locally
    const key = `upocket_pockets_${email.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(pockets));

    // 2. Cloud Mode Sync
    if (supabase) {
      // Supabase upsert requires the composite key (user_email, id)
      const rows = pockets.map(p => ({
        id: p.id,
        user_email: email.toLowerCase(),
        name: p.name,
        target_amount: p.targetAmount,
        current_amount: p.currentAmount,
        category: p.category,
        date: p.date,
        icon: p.icon
      }));

      // Delete existing pockets not present in this list to sync correctly
      const pocketIds = pockets.map(p => p.id);
      if (pocketIds.length > 0) {
        await supabase
          .from('upocket_pockets')
          .delete()
          .eq('user_email', email.toLowerCase())
          .not('id', 'in', `(${pocketIds.join(',')})`);
      } else {
        await supabase
          .from('upocket_pockets')
          .delete()
          .eq('user_email', email.toLowerCase());
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from('upocket_pockets')
          .upsert(rows);
        if (error) {
          console.error('Error guardando bolsillos en Supabase:', error);
          throw error;
        }
      }
    }
    return pockets;
  },

  // ==========================================
  // SYNC UTILITY (LOCAL -> CLOUD)
  // ==========================================
  syncLocalToCloud: async () => {
    if (!supabase) return;

    const localUsers = db.getLocalUsers();
    for (const user of localUsers) {
      // Sync User profile
      await supabase.from('upocket_users').upsert({
        email: user.email.toLowerCase(),
        name: user.name,
        password: user.password,
        initial_balance: user.initialBalance,
        fixed_expenses_list: user.fixedExpensesList,
        fixed_expenses: user.fixedExpenses,
        saving_goal: user.savingGoal,
        theme: user.theme || 'dark'
      });

      // Sync user expenses
      const localExps = db.getLocalExpenses(user.email);
      if (localExps.length > 0) {
        // Fetch existing from cloud to avoid duplicates
        const { data: cloudExps } = await supabase
          .from('upocket_expenses')
          .select('name, amount, date')
          .eq('user_email', user.email.toLowerCase());

        const isDuplicate = (exp, list) => {
          return list?.some(c => 
            c.name === exp.name && 
            parseFloat(c.amount) === exp.amount && 
            new Date(c.date).getTime() === new Date(exp.date).getTime()
          );
        };

        const newExps = localExps.filter(exp => !isDuplicate(exp, cloudExps)).map(e => ({
          user_email: user.email.toLowerCase(),
          name: e.name,
          amount: e.amount,
          type: e.type,
          details: e.details,
          date: e.date
        }));

        if (newExps.length > 0) {
          await supabase.from('upocket_expenses').insert(newExps);
        }
      }

      // Sync user pockets
      const localPockets = db.getLocalPockets(user.email);
      if (localPockets.length > 0) {
        const rows = localPockets.map(p => ({
          id: p.id,
          user_email: user.email.toLowerCase(),
          name: p.name,
          target_amount: p.targetAmount,
          current_amount: p.currentAmount,
          category: p.category,
          date: p.date,
          icon: p.icon
        }));
        await supabase.from('upocket_pockets').upsert(rows);
      }
    }
    console.log('Sincronización local completa con Supabase.');
  }
};
