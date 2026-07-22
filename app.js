// ============================================================
// BudgetBeat - Personal Finance Manager
// Income & Expense tracking with charts, filters & local storage
// ============================================================

// ========== STATE ==========
let transactions = [];
let deleteTargetId = null;
let currentEditId = null;
let currentUser = null;
let chartInstances = {
  incomeVsExpense: null,
  trend: null,
  analyticsIncomeExpense: null,
  daily: null
};

// ========== CATEGORY DEFINITIONS ==========
const CATEGORIES = {
  income: [
    'Salary', 'Freelance', 'Investments', 'Gifts',
    'Business', 'Rental Income', 'Dividends', 'Other Income'
  ],
  expense: [
    'Food & Drinks', 'Transportation', 'Shopping',
    'Bills & Utilities', 'Entertainment', 'Health',
    'Education', 'Rent', 'Savings', 'Other'
  ]
};

// ========== CATEGORY STORAGE ==========
function getCatKey() {
  return 'budgetbeat_cats_' + (currentUser ? currentUser.id : 'default');
}

function loadCategories() {
  try {
    const data = localStorage.getItem(getCatKey());
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.income && parsed.expense) return parsed;
    }
  } catch {}
  // Deep clone defaults
  return {
    income: [...CATEGORIES.income],
    expense: [...CATEGORIES.expense]
  };
}

function saveCategories(cats) {
  localStorage.setItem(getCatKey(), JSON.stringify(cats));
}

const CAT_ICONS = {
  'Salary': '💼', 'Freelance': '💻', 'Investments': '📈', 'Gifts': '🎁',
  'Business': '🏪', 'Rental Income': '🏠', 'Dividends': '🪙', 'Other Income': '📦',
  'Food & Drinks': '🍔', 'Transportation': '🚗', 'Shopping': '🛍️',
  'Bills & Utilities': '💡', 'Entertainment': '🎬', 'Health': '💊',
  'Education': '📚', 'Rent': '🏠', 'Savings': '💰', 'Other': '📦'
};

function getCatIcon(cat) {
  return CAT_ICONS[cat] || '📦';
}

// ========== DOM REFS ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Navigation
const sidebar = $('#sidebar');
const overlay = $('#overlay');
const menuToggle = $('#menuToggle');
const sidebarClose = $('#sidebarClose');
const navItems = $$('.nav-item');
const pages = $$('.page');
const pageTitle = $('#pageTitle');
const pageSubtitle = $('#pageSubtitle');

// Dashboard
const balanceAmount = $('#balanceAmount');
const totalIncome = $('#totalIncome');
const totalExpenseElem = $('#totalExpense');
const totalCount = $('#totalCount');
const balanceChange = $('#balanceChange');
const incomeChange = $('#incomeChange');
const expenseChange = $('#expenseChange');
const avgTransaction = $('#avgTransaction');
const recentList = $('#recentList');
const sidebarBalance = $('#sidebarBalance');

// Expenses Page
const expensesBody = $('#expensesBody');
const searchInput = $('#searchInput');
const filterType = $('#filterType');
const filterCategory = $('#filterCategory');
const filterMonth = $('#filterMonth');
const sortBy = $('#sortBy');
const expenseCount = $('#expenseCount');

// Form
const expenseForm = $('#expenseForm');
const expenseId = $('#expenseId');
const typeExpense = $('#typeExpense');
const typeIncome = $('#typeIncome');
const descInput = $('#description');
const amountInput = $('#amount');
const categorySelect = $('#category');
const dateInput = $('#date');
const paymentMethod = $('#paymentMethod');
const notesInput = $('#notes');
const formSubmit = $('#formSubmit');

// Modal
const deleteModal = $('#deleteModal');
const deleteDetail = $('#deleteDetail');
const modalConfirm = $('#modalConfirm');
const modalCancel = $('#modalCancel');
const modalClose = $('#modalClose');

// Toast
const toast = $('#toast');
const toastMessage = $('#toastMessage');

// Theme
const themeBtn = $('#themeBtn');

// Analytics
const analyticsPeriod = $('#analyticsPeriod');
const analyticsDayPicker = $('#analyticsDayPicker');
const statIncome = $('#statIncome');
const statExpense = $('#statExpense');
const statBalance = $('#statBalance');
const statHighestIncome = $('#statHighestIncome');
const statHighestExpense = $('#statHighestExpense');
const statCount = $('#statCount');

// Current Date
const currentDateSpan = $('#currentDate');

// Auth DOM
const authContainer = $('#authContainer');
const appContainer = $('#appContainer');
const loginFormEl = $('#loginForm');
const registerFormEl = $('#registerForm');
const loginFormElement = $('#loginFormElement');
const registerFormElement = $('#registerFormElement');
const loginEmail = $('#loginEmail');
const loginPassword = $('#loginPassword');
const regName = $('#regName');
const regEmail = $('#regEmail');
const regPassword = $('#regPassword');
const regConfirm = $('#regConfirm');
const showRegister = $('#showRegister');
const showLogin = $('#showLogin');
const authMessage = $('#authMessage');
const logoutBtn = $('#logoutBtn');
const sidebarUserName = $('#sidebarUserName');
const downloadReportBtn = $('#downloadReportBtn');
const printReport = $('#printReport');

// Forgot Password DOM
const forgotForm = $('#forgotForm');
const forgotFormElement = $('#forgotFormElement');
const forgotEmail = $('#forgotEmail');
const forgotNewPassword = $('#forgotNewPassword');
const forgotConfirmPassword = $('#forgotConfirmPassword');
const showForgot = $('#showForgot');
const showLoginFromForgot = $('#showLoginFromForgot');

// Remember Me
const rememberMe = $('#rememberMe');

// ========== AUTH SYSTEM ==========
function initAuth() {
  // Check session
  const savedUser = localStorage.getItem('budgetbeat_session');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showApp();
    } catch {
      currentUser = null;
      showAuth();
    }
  } else {
    showAuth();
  }

  // Load saved credentials (Remember Me)
  loadSavedCredentials();

  // Toggle forms
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormEl.classList.remove('active');
    registerFormEl.classList.add('active');
    forgotForm.classList.remove('active');
    clearAuthMessage();
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormEl.classList.remove('active');
    loginFormEl.classList.add('active');
    forgotForm.classList.remove('active');
    clearAuthMessage();
  });

  // Forgot Password toggle
  showForgot.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormEl.classList.remove('active');
    registerFormEl.classList.remove('active');
    forgotForm.classList.add('active');
    clearAuthMessage();
    // Pre-fill email from login form
    if (loginEmail.value) {
      forgotEmail.value = loginEmail.value;
    }
  });

  showLoginFromForgot.addEventListener('click', (e) => {
    e.preventDefault();
    forgotForm.classList.remove('active');
    loginFormEl.classList.add('active');
    clearAuthMessage();
  });

  // Register
  registerFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = regName.value.trim();
    const email = regEmail.value.trim().toLowerCase();
    const password = regPassword.value;
    const confirm = regConfirm.value;

    if (!name || !email || !password) {
      showAuthMessage('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthMessage('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirm) {
      showAuthMessage('Passwords do not match', 'error');
      return;
    }

    // Check if email already registered
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      showAuthMessage('An account with this email already exists', 'error');
      return;
    }

    // Create user
    const user = {
      id: Date.now().toString(36),
      name,
      email,
      password: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    // Auto-login
    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('budgetbeat_session', JSON.stringify(currentUser));

    showAuthMessage('Account created successfully!', 'success');
    setTimeout(() => {
      showApp();
      registerFormElement.reset();
    }, 800);
  });

  // Login
  loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
      showAuthMessage('Please fill in all fields', 'error');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === hashPassword(password));

    if (!user) {
      showAuthMessage('Invalid email or password', 'error');
      return;
    }

    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('budgetbeat_session', JSON.stringify(currentUser));

    // Remember Me
    if (rememberMe.checked) {
      localStorage.setItem('budgetbeat_saved_login', JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem('budgetbeat_saved_login');
    }

    showAuthMessage('Welcome back!', 'success');
    setTimeout(() => {
      showApp();
      loginFormElement.reset();
    }, 600);
  });

  // Forgot Password
  forgotFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = forgotEmail.value.trim().toLowerCase();
    const newPass = forgotNewPassword.value;
    const confirmPass = forgotConfirmPassword.value;

    if (!email || !newPass || !confirmPass) {
      showAuthMessage('Please fill in all fields', 'error');
      return;
    }

    if (newPass.length < 6) {
      showAuthMessage('Password must be at least 6 characters', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      showAuthMessage('Passwords do not match', 'error');
      return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      showAuthMessage('No account found with this email', 'error');
      return;
    }

    // Update password
    users[userIndex].password = hashPassword(newPass);
    saveUsers(users);

    // Clear any saved login with old password
    const saved = JSON.parse(localStorage.getItem('budgetbeat_saved_login') || 'null');
    if (saved && saved.email === email) {
      localStorage.removeItem('budgetbeat_saved_login');
    }

    showAuthMessage('Password reset successfully! You can now log in.', 'success');
    forgotFormElement.reset();
    setTimeout(() => {
      forgotForm.classList.remove('active');
      loginFormEl.classList.add('active');
      loginEmail.value = email;
      clearAuthMessage();
    }, 1500);
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('budgetbeat_session');
    showAuth();
    // Clear sensitive form fields
    loginFormElement.reset();
    registerFormElement.reset();
    forgotFormElement.reset();
    clearAuthMessage();
    showToast('Logged out successfully', 'success');
  });

  // Enter key to submit on auth forms
  [loginFormElement, registerFormElement, forgotFormElement].forEach(form => {
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  });
}

// ========== REMEMBER ME ==========
function loadSavedCredentials() {
  try {
    const saved = JSON.parse(localStorage.getItem('budgetbeat_saved_login') || 'null');
    if (saved && saved.email && saved.password) {
      loginEmail.value = saved.email;
      loginPassword.value = saved.password;
      rememberMe.checked = true;
    }
  } catch {}
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('budgetbeat_users') || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('budgetbeat_users', JSON.stringify(users));
}

// Simple hash function (NOT cryptographically secure - for demo only)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

function showApp() {
  authContainer.classList.add('hidden');
  appContainer.style.display = 'flex';
  if (currentUser) {
    sidebarUserName.textContent = currentUser.name || currentUser.email;
  }
  // Re-render everything for the logged-in user
  loadTransactions();
  renderAll();
}

function showAuth() {
  authContainer.classList.remove('hidden');
  appContainer.style.display = 'none';
  loginFormEl.classList.add('active');
  registerFormEl.classList.remove('active');
  forgotForm.classList.remove('active');
  clearAuthMessage();
}

function showAuthMessage(msg, type) {
  authMessage.textContent = msg;
  authMessage.className = 'auth-message show ' + type;
}

function clearAuthMessage() {
  authMessage.textContent = '';
  authMessage.className = 'auth-message';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  renderCurrentDate();
  initTheme();
  initNavigation();
  initForm();
  initTypeToggle();
  initModal();
  initSearchAndFilter();
  initQuickAdd();
  initAnalytics();
  setDefaultDate();

  // Initialize auth (this will call showApp/showAuth which loads data and renders)
  initAuth();
});

// ========== LOCAL STORAGE ==========
function getStorageKey() {
  const uid = currentUser ? currentUser.id : 'default';
  return 'budgetbeat_txns_' + uid;
}

function loadTransactions() {
  try {
    const key = getStorageKey();
    const data = localStorage.getItem(key);
    transactions = data ? JSON.parse(data) : [];
    // Migrate old data (add type field)
    let migrated = false;
    transactions = transactions.map(t => {
      if (!t.type) {
        migrated = true;
        return { ...t, type: 'expense' };
      }
      return t;
    });
    if (migrated) saveTransactions();
  } catch {
    transactions = [];
  }
}

function saveTransactions() {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(transactions));
}

// ========== DATE HELPERS ==========
function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthName(monthIndex) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
}

function getCurrentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonthYear() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function renderCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateSpan.textContent = now.toLocaleDateString('en-US', options);
}

function setDefaultDate() {
  dateInput.value = getToday();
}

// ========== TRANSACTION CRUD ==========
function addTransaction(data) {
  const txn = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    type: data.type,
    description: data.description.trim(),
    amount: parseFloat(data.amount),
    category: data.category,
    date: data.date,
    paymentMethod: data.paymentMethod || 'Cash',
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
  transactions.unshift(txn);
  saveTransactions();
  renderAll();
  const label = data.type === 'income' ? 'Income' : 'Expense';
  showToast(`${label} added successfully!`, 'success');
  return txn;
}

function updateTransaction(id, data) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  transactions[idx] = {
    ...transactions[idx],
    type: data.type,
    description: data.description.trim(),
    amount: parseFloat(data.amount),
    category: data.category,
    date: data.date,
    paymentMethod: data.paymentMethod || transactions[idx].paymentMethod,
    notes: data.notes || ''
  };
  saveTransactions();
  renderAll();
  showToast('Transaction updated successfully!', 'success');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderAll();
  showToast('Transaction deleted.', 'error');
}

function getTransactionById(id) {
  return transactions.find(t => t.id === id);
}

// ========== FILTER HELPERS ==========
function getIncome() {
  return transactions.filter(t => t.type === 'income');
}

function getExpenses() {
  return transactions.filter(t => t.type === 'expense');
}

function getIncomeTotal() {
  return getIncome().reduce((s, t) => s + t.amount, 0);
}

function getExpenseTotal() {
  return getExpenses().reduce((s, t) => s + t.amount, 0);
}

function getBalance() {
  return getIncomeTotal() - getExpenseTotal();
}

// ========== FORMAT HELPERS ==========
function formatCurrency(amount) {
  return 'Rs ' + parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getCategoryIcon(cat) {
  const icons = {
    'Food & Drinks': 'fa-utensils',
    'Transportation': 'fa-car',
    'Shopping': 'fa-shopping-bag',
    'Bills & Utilities': 'fa-bolt',
    'Entertainment': 'fa-film',
    'Health': 'fa-heartbeat',
    'Education': 'fa-graduation-cap',
    'Rent': 'fa-home',
    'Savings': 'fa-piggy-bank',
    'Salary': 'fa-briefcase',
    'Freelance': 'fa-laptop',
    'Investments': 'fa-chart-line',
    'Gifts': 'fa-gift',
    'Business': 'fa-store',
    'Rental Income': 'fa-building',
    'Dividends': 'fa-coins',
    'Other Income': 'fa-ellipsis-h',
    'Other': 'fa-ellipsis-h'
  };
  return icons[cat] || 'fa-receipt';
}

function getCategoryColor(cat) {
  const colors = {
    // Expense categories
    'Food & Drinks': '#ff6b6b',
    'Transportation': '#74b9ff',
    'Shopping': '#fd79a8',
    'Bills & Utilities': '#fdcb6e',
    'Entertainment': '#a29bfe',
    'Health': '#00b894',
    'Education': '#81ecec',
    'Rent': '#dfe6e9',
    'Savings': '#55efc4',
    // Income categories
    'Salary': '#00b894',
    'Freelance': '#6c5ce7',
    'Investments': '#fdcb6e',
    'Gifts': '#ff6b6b',
    'Business': '#0984e3',
    'Rental Income': '#00cec9',
    'Dividends': '#e17055',
    'Other Income': '#636e72',
    'Other': '#636e72'
  };
  return colors[cat] || '#636e72';
}

function getCategoryBadgeClass(cat) {
  const safe = cat.replace(/[^a-zA-Z0-9]/g, '');
  return `cat-${safe}`;
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== COMPUTED DATA ==========
function getMonthTransactions(type) {
  const curr = getCurrentMonthYear();
  return transactions.filter(t =>
    (type ? t.type === type : true) &&
    getMonthYear(t.date) === curr
  );
}

function getCategoryTotals(type) {
  const cats = {};
  const filtered = type ? transactions.filter(t => t.type === type) : transactions;
  filtered.forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + t.amount;
  });
  return Object.entries(cats)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function getTopCategory(type) {
  const cats = getCategoryTotals(type);
  return cats.length ? cats[0] : null;
}

function getMonthlyTotals() {
  const incomeMap = {};
  const expenseMap = {};

  getIncome().forEach(t => {
    const key = getMonthYear(t.date);
    incomeMap[key] = (incomeMap[key] || 0) + t.amount;
  });

  getExpenses().forEach(t => {
    const key = getMonthYear(t.date);
    expenseMap[key] = (expenseMap[key] || 0) + t.amount;
  });

  const allKeys = [...new Set([...Object.keys(incomeMap), ...Object.keys(expenseMap)])].sort();

  return allKeys.map(month => ({
    month,
    income: incomeMap[month] || 0,
    expense: expenseMap[month] || 0
  }));
}

// ========== RENDER FUNCTIONS ==========
function renderAll() {
  const incomeTotal = getIncomeTotal();
  const expenseTotal = getExpenseTotal();
  const balance = incomeTotal - expenseTotal;

  // Sidebar
  sidebarBalance.textContent = formatCurrency(balance);

  renderCards(incomeTotal, expenseTotal, balance);
  renderRecent();
  renderExpensesTable();
  renderIncomeVsExpenseChart(incomeTotal, expenseTotal);
  renderTrendChart();
  renderAnalytics();
  refreshFilterCategories();
}

function renderCards(incomeTotal, expenseTotal, balance) {
  const monthIncome = getMonthTransactions('income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = getMonthTransactions('expense').reduce((s, t) => s + t.amount, 0);

  // Balance card
  balanceAmount.textContent = formatCurrency(balance);
  balanceAmount.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
  balanceChange.textContent = balance >= 0 ? '💰 You\'re saving!' : '⚠️ Overspending!';
  balanceChange.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

  // Income card
  totalIncome.textContent = formatCurrency(incomeTotal);
  const prevIncome = transactions.filter(t =>
    t.type === 'income' && getMonthYear(t.date) === getPreviousMonthYear()
  ).reduce((s, t) => s + t.amount, 0);
  if (prevIncome > 0) {
    const chg = ((monthIncome - prevIncome) / prevIncome * 100).toFixed(1);
    incomeChange.textContent = `${chg >= 0 ? '+' : ''}${chg}%`;
    incomeChange.style.color = chg >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
  } else if (monthIncome > 0) {
    incomeChange.textContent = 'New';
    incomeChange.style.color = 'var(--income-color)';
  } else {
    incomeChange.textContent = '0%';
  }

  // Expense card
  totalExpenseElem.textContent = formatCurrency(expenseTotal);
  const prevExpense = transactions.filter(t =>
    t.type === 'expense' && getMonthYear(t.date) === getPreviousMonthYear()
  ).reduce((s, t) => s + t.amount, 0);
  if (prevExpense > 0) {
    const chg = ((monthExpense - prevExpense) / prevExpense * 100).toFixed(1);
    expenseChange.textContent = `${chg >= 0 ? '+' : ''}${chg}%`;
    expenseChange.style.color = chg > 0 ? 'var(--expense-color)' : 'var(--income-color)';
  } else if (monthExpense > 0) {
    expenseChange.textContent = 'New';
    expenseChange.style.color = 'var(--expense-color)';
  } else {
    expenseChange.textContent = '0%';
  }

  // Count card
  totalCount.textContent = transactions.length;
  const totalAmt = incomeTotal + expenseTotal;
  avgTransaction.textContent = `Total: ${formatCurrency(totalAmt)}`;
}

function renderRecent() {
  const recent = transactions.slice(0, 5);
  if (!recent.length) {
    recentList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No transactions yet. Start adding!</p>
      </div>`;
    return;
  }

  recentList.innerHTML = recent.map(t => {
    const isIncome = t.type === 'income';
    const color = isIncome ? 'var(--income-color)' : 'var(--expense-color)';
    const prefix = isIncome ? '+' : '-';
    return `
    <div class="recent-item">
      <div class="recent-cat-icon" style="background: ${getCategoryColor(t.category)}18; color: ${getCategoryColor(t.category)}">
        <i class="fas ${getCategoryIcon(t.category)}"></i>
      </div>
      <div class="recent-info">
        <span class="recent-desc">${escHtml(t.description)}</span>
        <span class="recent-date">${formatDate(t.date)} · ${t.category}</span>
      </div>
      <div class="recent-amount" style="color: ${color}">${prefix}${formatCurrency(t.amount).replace('Rs ', '')}</div>
      <button class="recent-delete" onclick="handleDeleteClick('${t.id}')" title="Delete">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>`;
  }).join('');
}

function renderExpensesTable() {
  const search = searchInput.value.toLowerCase().trim();
  const typeF = filterType.value;
  const catFilter = filterCategory.value;
  const monthFilter = filterMonth.value;
  const sort = sortBy.value;

  let filtered = [...transactions];

  // Type filter
  if (typeF !== 'all') {
    filtered = filtered.filter(t => t.type === typeF);
  }

  // Search
  if (search) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search) ||
      t.notes.toLowerCase().includes(search)
    );
  }

  // Category filter
  if (catFilter !== 'all') {
    filtered = filtered.filter(t => t.category === catFilter);
  }

  // Month filter
  if (monthFilter === 'this') {
    filtered = filtered.filter(t => getMonthYear(t.date) === getCurrentMonthYear());
  } else if (monthFilter === 'last') {
    filtered = filtered.filter(t => getMonthYear(t.date) === getPreviousMonthYear());
  }

  // Sort
  switch (sort) {
    case 'newest': filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)); break;
    case 'oldest': filtered.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); break;
    case 'highest': filtered.sort((a, b) => b.amount - a.amount); break;
    case 'lowest': filtered.sort((a, b) => a.amount - b.amount); break;
  }

  expenseCount.textContent = `Showing ${filtered.length} of ${transactions.length} transactions`;

  if (!filtered.length) {
    expensesBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-cell">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>No transactions found</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  expensesBody.innerHTML = filtered.map((t, i) => {
    const isIncome = t.type === 'income';
    const badgeClass = isIncome ? 'income' : 'expense';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';
    const prefix = isIncome ? '+' : '-';

    return `
    <tr>
      <td>${i + 1}</td>
      <td><span class="type-badge ${badgeClass}">
        <i class="fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
        ${isIncome ? 'Income' : 'Expense'}
      </span></td>
      <td><strong>${escHtml(t.description)}</strong></td>
      <td><span class="category-badge ${getCategoryBadgeClass(t.category)}">
        <i class="fas ${getCategoryIcon(t.category)}"></i> ${t.category}
      </span></td>
      <td class="${amountClass}">${prefix}${formatCurrency(t.amount).replace('Rs ', '')}</td>
      <td>${formatDate(t.date)}</td>
      <td>
        <button class="action-btn edit" onclick="handleEditClick('${t.id}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" onclick="handleDeleteClick('${t.id}')" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ========== EXPENSE BY CATEGORY CHART (Doughnut) ==========
function renderIncomeVsExpenseChart(incomeTotal, expenseTotal) {
  const canvas = document.getElementById('incomeVsExpenseChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstances.incomeVsExpense) {
    chartInstances.incomeVsExpense.destroy();
  }

  const expenses = transactions.filter(t => t.type === 'expense');
  if (!expenses.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const categoryMap = {};
  expenses.forEach(t => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const labels = sortedCats.map(c => c[0]);
  const data = sortedCats.map(c => c[1]);

  const COLORS = ['#ff6b6b', '#ffa502', '#ffc048', '#ff4757', '#ff6348', '#e17055', '#d63031', '#fdcb6e', '#e84393', '#6c5ce7'];

  chartInstances.incomeVsExpense = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 14,
            usePointStyle: true,
            font: { family: 'Inter', size: 12 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#636e72'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// ========== TREND CHART (Line - Income vs Expense) ==========
function renderTrendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstances.trend) {
    chartInstances.trend.destroy();
  }

  const monthly = getMonthlyTotals();
  if (!monthly.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const recent = monthly.slice(-6);

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: recent.map(m => {
        const [, month] = m.month.split('-');
        return getMonthName(parseInt(month) - 1);
      }),
      datasets: [
        {
          label: 'Income',
          data: recent.map(m => m.income),
          borderColor: '#00b894',
          backgroundColor: 'rgba(0, 184, 148, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00b894',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Expenses',
          data: recent.map(m => m.expense),
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff6b6b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 14,
            font: { family: 'Inter', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#636e72'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#b2bec3',
            callback: v => 'Rs ' + v.toLocaleString()
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e9ecef'
          }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#b2bec3'
          },
          grid: { display: false }
        }
      }
    }
  });
}

// ========== ANALYTICS ==========
function renderAnalytics() {
  const val = analyticsPeriod.value;
  const isAll = val === 'all';
  const isDay = val === 'day';

  let filtered = [];
  if (isAll) {
    filtered = [...transactions];
  } else if (isDay) {
    const selectedDate = analyticsDayPicker.value;
    if (!selectedDate) {
      filtered = [];
    } else {
      filtered = transactions.filter(t => t.date === selectedDate);
    }
  } else {
    const period = parseInt(val);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    filtered = transactions.filter(t => t.date >= cutoffStr);
  }

  if (!filtered.length) {
    statIncome.textContent = 'Rs 0';
    statExpense.textContent = 'Rs 0';
    statBalance.textContent = 'Rs 0';
    statHighestIncome.textContent = 'Rs 0';
    statHighestExpense.textContent = 'Rs 0';
    statCount.textContent = '0';
    renderAnalyticsIncomeExpenseChart(0, 0);
    renderDailyChart([]);
    return;
  }

  const incomeTxns = filtered.filter(t => t.type === 'income');
  const expenseTxns = filtered.filter(t => t.type === 'expense');
  const totalInc = incomeTxns.reduce((s, t) => s + t.amount, 0);
  const totalExp = expenseTxns.reduce((s, t) => s + t.amount, 0);
  const bal = totalInc - totalExp;

  statIncome.textContent = formatCurrency(totalInc);
  statExpense.textContent = formatCurrency(totalExp);
  statBalance.textContent = formatCurrency(bal);
  statBalance.style.color = bal >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

  const highestInc = incomeTxns.length ? Math.max(...incomeTxns.map(t => t.amount)) : 0;
  const highestExp = expenseTxns.length ? Math.max(...expenseTxns.map(t => t.amount)) : 0;
  statHighestIncome.textContent = formatCurrency(highestInc);
  statHighestExpense.textContent = formatCurrency(highestExp);
  statCount.textContent = filtered.length;

  renderAnalyticsIncomeExpenseChart(totalInc, totalExp);

  const days = isAll ? 365 : period;
  renderDailyChart(filtered, days);
}

function renderAnalyticsIncomeExpenseChart(incomeTotal, expenseTotal) {
  const canvas = document.getElementById('analyticsIncomeExpenseChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstances.analyticsIncomeExpense) {
    chartInstances.analyticsIncomeExpense.destroy();
  }

  if (incomeTotal === 0 && expenseTotal === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  chartInstances.analyticsIncomeExpense = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [incomeTotal, expenseTotal],
        backgroundColor: ['#00b894', '#ff6b6b'],
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 14,
            usePointStyle: true,
            font: { family: 'Inter', size: 12 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#636e72'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      },
      cutout: '55%'
    }
  });
}

function renderDailyChart(filtered, days) {
  const canvas = document.getElementById('dailyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstances.daily) {
    chartInstances.daily.destroy();
  }

  const displayDays = Math.min(days, 90);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - displayDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const dailyInc = {};
  const dailyExp = {};

  (filtered.length ? filtered : transactions)
    .filter(t => t.date >= cutoffStr)
    .forEach(t => {
      if (t.type === 'income') {
        dailyInc[t.date] = (dailyInc[t.date] || 0) + t.amount;
      } else {
        dailyExp[t.date] = (dailyExp[t.date] || 0) + t.amount;
      }
    });

  const dates = [...new Set([
    ...Object.keys(dailyInc),
    ...Object.keys(dailyExp)
  ])].sort();

  if (!dates.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  chartInstances.daily = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates.map(d => {
        const dt = new Date(d + 'T00:00:00');
        return `${dt.getDate()}/${dt.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: 'Income',
          data: dates.map(d => dailyInc[d] || 0),
          backgroundColor: 'rgba(0, 184, 148, 0.7)',
          borderColor: '#00b894',
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 24
        },
        {
          label: 'Expenses',
          data: dates.map(d => dailyExp[d] || 0),
          backgroundColor: 'rgba(255, 107, 107, 0.7)',
          borderColor: '#ff6b6b',
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 24
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 12,
            font: { family: 'Inter', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#636e72'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#b2bec3',
            callback: v => 'Rs ' + v.toLocaleString()
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e9ecef'
          }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 10 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#b2bec3',
            maxRotation: 45
          },
          grid: { display: false }
        }
      }
    }
  });
}

// ========== NAVIGATION ==========
const pageConfigs = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your finances', icon: 'chart-pie' },
  expenses: { title: 'Transactions', subtitle: 'Manage your income & expenses', icon: 'list-ul' },
  add: { title: 'Add Transaction', subtitle: 'Record income or expense', icon: 'plus-circle' },
  analytics: { title: 'Analytics', subtitle: 'Deep insights into your finances', icon: 'chart-line' },
  categories: { title: 'Categories', subtitle: 'Manage & reorder your categories', icon: 'tags' }
};

function initNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      const page = el.dataset.page;
      if (page && pageConfigs[page]) {
        e.preventDefault();
        navigateTo(page);
      }
    });
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  });

  sidebarClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // FAB click
  const fabBtn = $('#fabBtn');
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      navigateTo('add');
    });
  }
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

function navigateTo(page) {
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = '';
  }

  const config = pageConfigs[page];
  if (config) {
    pageTitle.textContent = config.title;
    pageSubtitle.textContent = config.subtitle;
  }

  // Re-render charts after navigating
  if (page === 'dashboard') {
    setTimeout(() => {
      renderIncomeVsExpenseChart(getIncomeTotal(), getExpenseTotal());
      renderTrendChart();
    }, 150);
  }
  if (page === 'analytics') {
    setTimeout(() => renderAnalytics(), 150);
  }
  if (page === 'add') {
    setTimeout(updateCategoryOptions, 50);
  }
  if (page === 'categories') {
    setTimeout(renderCategoryManager, 50);
  }
}

// ========== TYPE TOGGLE & CATEGORY MANAGEMENT ==========
function initTypeToggle() {
  const updateTypeStyle = () => {
    const toggle = document.querySelector('.type-toggle');
    if (!toggle) return;
    if (typeIncome.checked) {
      toggle.style.borderColor = 'var(--income-color)';
      toggle.style.boxShadow = '0 0 0 3px var(--income-glow)';
      document.querySelector('.type-income').style.background = 'linear-gradient(135deg, var(--income-color), #00a381)';
      document.querySelector('.type-income').style.color = '#fff';
      document.querySelector('.type-expense').style.background = 'transparent';
      document.querySelector('.type-expense').style.color = 'var(--expense-color)';
    } else {
      toggle.style.borderColor = 'var(--expense-color)';
      toggle.style.boxShadow = '0 0 0 3px var(--expense-glow)';
      document.querySelector('.type-expense').style.background = 'linear-gradient(135deg, var(--expense-color), #e74c3c)';
      document.querySelector('.type-expense').style.color = '#fff';
      document.querySelector('.type-income').style.background = 'transparent';
      document.querySelector('.type-income').style.color = 'var(--income-color)';
    }
  };

  // Initial style + category options
  setTimeout(() => {
    updateTypeStyle();
    updateCategoryOptions();
  }, 50);

  // Update on change
  document.querySelectorAll('input[name="txnType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateTypeStyle();
      updateCategoryOptions();
      updateFormLabels();
    });
  });
}

function updateCategoryOptions() {
  const isIncome = typeIncome.checked;
  const stored = loadCategories();
  const cats = isIncome ? stored.income : stored.expense;
  const currentValue = categorySelect.value;

  categorySelect.innerHTML = '<option value="" disabled hidden>Select Category</option>' +
    cats.map(c => {
      const icon = getCatIcon(c);
      return `<option value="${c}">${icon} ${c}</option>`;
    }).join('');

  // Try to keep current selection if valid
  categorySelect.value = cats.includes(currentValue) ? currentValue : '';
}

function updateFormLabels() {
  const isIncome = typeIncome.checked;
  const label = isIncome ? 'Income' : 'Expense';
  formSubmit.innerHTML = `<i class="fas fa-plus"></i> Add ${label}`;
}

// ========== FORM HANDLING ==========
function initForm() {
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = typeIncome.checked ? 'income' : 'expense';

    const data = {
      type,
      description: descInput.value,
      amount: amountInput.value,
      category: categorySelect.value,
      date: dateInput.value,
      paymentMethod: paymentMethod.value,
      notes: notesInput.value
    };

    const editId = expenseId.value;

    if (editId) {
      updateTransaction(editId, data);
      expenseId.value = '';
      currentEditId = null;
      formSubmit.innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
    } else {
      addTransaction(data);
    }

    resetForm();
  });

  $('#formReset').addEventListener('click', resetForm);
}

function resetForm() {
  expenseForm.reset();
  expenseId.value = '';
  currentEditId = null;
  setDefaultDate();
  paymentMethod.value = 'Cash';
  typeExpense.checked = true;
  updateCategoryOptions();
  formSubmit.innerHTML = '<i class="fas fa-plus"></i> Add Expense';
  // Trigger type toggle style update
  const evt = new Event('change');
  typeExpense.dispatchEvent(evt);
}

function handleEditClick(id) {
  const txn = getTransactionById(id);
  if (!txn) return;

  currentEditId = id;
  expenseId.value = id;

  // Set type
  if (txn.type === 'income') {
    typeIncome.checked = true;
  } else {
    typeExpense.checked = true;
  }
  updateCategoryOptions();
  // Trigger type toggle style update
  const evt = new Event('change');
  (txn.type === 'income' ? typeIncome : typeExpense).dispatchEvent(evt);

  descInput.value = txn.description;
  amountInput.value = txn.amount;
  categorySelect.value = txn.category;
  dateInput.value = txn.date;
  paymentMethod.value = txn.paymentMethod || 'Cash';
  notesInput.value = txn.notes || '';

  const label = txn.type === 'income' ? 'Income' : 'Expense';
  formSubmit.innerHTML = `<i class="fas fa-save"></i> Update ${label}`;

  navigateTo('add');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleDeleteClick(id) {
  const txn = getTransactionById(id);
  if (!txn) return;
  deleteTargetId = id;
  deleteDetail.innerHTML = `"${escHtml(txn.description)}" - ${formatCurrency(txn.amount)}`;
  deleteModal.classList.add('active');
}

// ========== MODAL ==========
function initModal() {
  modalConfirm.addEventListener('click', () => {
    if (deleteTargetId) {
      deleteTransaction(deleteTargetId);
      deleteTargetId = null;
    }
    deleteModal.classList.remove('active');
  });

  const closeModal = () => {
    deleteTargetId = null;
    deleteModal.classList.remove('active');
  };

  modalCancel.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeModal();
  });
}

// ========== SEARCH & FILTER ==========
function initSearchAndFilter() {
  searchInput.addEventListener('input', renderExpensesTable);
  filterType.addEventListener('change', () => {
    refreshFilterCategories();
    renderExpensesTable();
  });
  filterCategory.addEventListener('change', renderExpensesTable);
  filterMonth.addEventListener('change', renderExpensesTable);
  sortBy.addEventListener('change', renderExpensesTable);

  refreshFilterCategories();
}

function refreshFilterCategories() {
  const current = filterCategory.value;
  const typeF = filterType.value;

  let cats;
  if (typeF === 'income') {
    cats = [...new Set(transactions.filter(t => t.type === 'income').map(t => t.category))].sort();
  } else if (typeF === 'expense') {
    cats = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))].sort();
  } else {
    cats = [...new Set(transactions.map(t => t.category))].sort();
  }

  filterCategory.innerHTML = '<option value="all">All Categories</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  filterCategory.value = cats.includes(current) ? current : 'all';
}

// ========== QUICK ADD ==========
function initQuickAdd() {
  let editingBtn = null;

  // Close any open editor when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (editingBtn && !editingBtn.contains(e.target)) {
      cancelEdit(editingBtn);
      editingBtn = null;
    }
  });

  $$('.quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If already editing this button, ignore (input handles its own events)
      if (btn.classList.contains('quick-editing')) return;

      // If another button is being edited, cancel it first
      if (editingBtn && editingBtn !== btn) {
        cancelEdit(editingBtn);
      }

      startEdit(btn);
      editingBtn = btn;
      e.stopPropagation();
    });
  });

  function startEdit(btn) {
    const oldAmount = btn.dataset.amount;
    const amountEl = btn.querySelector('.quick-amount');
    if (!amountEl) return;

    btn.classList.add('quick-editing');

    // Replace amount text with an input
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'quick-edit-input';
    input.value = oldAmount;
    input.min = '0.01';
    input.step = '0.01';
    input.autofocus = true;
    input.setAttribute('aria-label', 'Edit amount');

    // Create confirm/cancel buttons
    const actions = document.createElement('div');
    actions.className = 'quick-edit-actions';
    actions.innerHTML = `
      <button class="quick-edit-confirm" title="Confirm"><i class="fas fa-check"></i></button>
      <button class="quick-edit-cancel" title="Cancel"><i class="fas fa-times"></i></button>
    `;

    amountEl.replaceWith(input);
    btn.appendChild(actions);
    input.focus();
    input.select();

    // Confirm handlers
    const confirm = () => {
      const val = parseFloat(input.value);
      if (!val || val <= 0) {
        showToast('Enter a valid amount', 'error');
        input.focus();
        input.select();
        return;
      }

      const cat = btn.dataset.cat;
      const type = btn.dataset.type || 'expense';
      const desc = btn.querySelector('span').textContent;

      addTransaction({
        type,
        description: desc,
        amount: val,
        category: cat,
        date: getToday(),
        paymentMethod: 'Cash',
        notes: ''
      });

      finishEdit(btn, val);
      editingBtn = null;
    };

    const cancel = () => {
      cancelEdit(btn);
      if (editingBtn === btn) editingBtn = null;
    };

    // Events
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); confirm(); }
      if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
    });

    actions.querySelector('.quick-edit-confirm').addEventListener('click', (ev) => {
      ev.stopPropagation(); confirm();
    });
    actions.querySelector('.quick-edit-cancel').addEventListener('click', (ev) => {
      ev.stopPropagation(); cancel();
    });
  }

  function finishEdit(btn, newAmount) {
    btn.classList.remove('quick-editing');
    const input = btn.querySelector('.quick-edit-input');
    const actions = btn.querySelector('.quick-edit-actions');
    if (!input) return;

    // Update data attribute and display
    btn.dataset.amount = newAmount;
    const formatted = 'Rs ' + Number(newAmount).toLocaleString('en-LK');
    const amountSpan = document.createElement('span');
    amountSpan.className = 'quick-amount';
    amountSpan.textContent = formatted;

    input.replaceWith(amountSpan);
    if (actions) actions.remove();
  }

  function cancelEdit(btn) {
    if (!btn || !btn.classList.contains('quick-editing')) return;
    btn.classList.remove('quick-editing');
    const input = btn.querySelector('.quick-edit-input');
    const actions = btn.querySelector('.quick-edit-actions');
    const oldAmount = btn.dataset.amount;

    if (input) {
      const formatted = 'Rs ' + Number(oldAmount).toLocaleString('en-LK');
      const amountSpan = document.createElement('span');
      amountSpan.className = 'quick-amount';
      amountSpan.textContent = formatted;
      input.replaceWith(amountSpan);
    }
    if (actions) actions.remove();
  }
}

// ========== ANALYTICS PERIOD ==========
function initAnalytics() {
  analyticsDayPicker.value = new Date().toISOString().split('T')[0];
  analyticsPeriod.addEventListener('change', () => {
    analyticsDayPicker.style.display = analyticsPeriod.value === 'day' ? 'inline-block' : 'none';
    renderAnalytics();
  });
  analyticsDayPicker.addEventListener('change', renderAnalytics);
}

// ========== THEME ==========
function initTheme() {
  const saved = localStorage.getItem('budgetbeat_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('budgetbeat_theme', 'light');
      themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('budgetbeat_theme', 'dark');
      themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    setTimeout(() => {
      renderIncomeVsExpenseChart(getIncomeTotal(), getExpenseTotal());
      renderTrendChart();
      renderAnalytics();
    }, 200);
  });
}

// ========== DRAG & DROP CATEGORY MANAGER ==========
function renderCategoryManager() {
  const container = document.getElementById('categoryManager');
  if (!container) return;

  const stored = loadCategories();

  container.innerHTML = `
    <div class="cat-mgr-grid">
      <div class="cat-mgr-column">
        <div class="cat-mgr-header income-header">
          <i class="fas fa-arrow-down"></i> Income Categories
          <span class="cat-count">${stored.income.length}</span>
        </div>
        <div class="cat-mgr-list" data-type="income" id="catListIncome">
          ${stored.income.map((c, i) => renderCatItem(c, i, 'income')).join('')}
        </div>
        <div class="cat-mgr-add">
          <input type="text" class="cat-mgr-input" id="catInputIncome"
            placeholder="Add income category..." maxlength="30" />
          <button class="cat-mgr-add-btn income-add" onclick="addCategoryItem('income')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <div class="cat-mgr-column">
        <div class="cat-mgr-header expense-header">
          <i class="fas fa-arrow-up"></i> Expense Categories
          <span class="cat-count">${stored.expense.length}</span>
        </div>
        <div class="cat-mgr-list" data-type="expense" id="catListExpense">
          ${stored.expense.map((c, i) => renderCatItem(c, i, 'expense')).join('')}
        </div>
        <div class="cat-mgr-add">
          <input type="text" class="cat-mgr-input" id="catInputExpense"
            placeholder="Add expense category..." maxlength="30" />
          <button class="cat-mgr-add-btn expense-add" onclick="addCategoryItem('expense')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="cat-mgr-actions">
      <button class="btn btn-secondary" onclick="resetAllCategories()">
        <i class="fas fa-undo"></i> Reset to Defaults
      </button>
    </div>
  `;

  // Attach drag-and-drop after DOM is ready
  setTimeout(attachDragDrop, 50);
}

function renderCatItem(cat, index, type) {
  const icon = getCatIcon(cat);
  return `
    <div class="cat-item" draggable="true"
         data-cat="${escHtml(cat)}" data-type="${type}" data-index="${index}">
      <div class="cat-item-drag"><i class="fas fa-grip-lines"></i></div>
      <span class="cat-item-icon">${icon}</span>
      <span class="cat-item-name">${escHtml(cat)}</span>
      <button class="cat-item-del" onclick="deleteCategoryItem('${type}','${escHtml(cat)}')"
        ${CATEGORIES[type].includes(cat) ? '' : 'style="opacity:1"'}>
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

function attachDragDrop() {
  const lists = document.querySelectorAll('.cat-mgr-list');
  lists.forEach(list => {
    // Remove old listeners by cloning drag events
    list.addEventListener('dragstart', handleDragStart);
    list.addEventListener('dragend', handleDragEnd);
    list.addEventListener('dragover', handleDragOver);
    list.addEventListener('dragenter', handleDragEnter);
    list.addEventListener('dragleave', handleDragLeave);
    list.addEventListener('drop', handleDrop);
  });

  // Also allow Enter key on input
  document.querySelectorAll('.cat-mgr-input').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const type = inp.id === 'catInputIncome' ? 'income' : 'expense';
        addCategoryItem(type);
      }
    });
  });
}

let dragSource = null;

function handleDragStart(e) {
  const item = e.target.closest('.cat-item');
  if (!item) return;
  dragSource = item;
  item.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', item.dataset.cat);
}

function handleDragEnd(e) {
  document.querySelectorAll('.cat-item.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.cat-mgr-list.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSource = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  const list = e.target.closest('.cat-mgr-list');
  if (list) list.classList.add('drag-over');
}

function handleDragLeave(e) {
  const list = e.target.closest('.cat-mgr-list');
  if (list && !list.contains(e.relatedTarget)) {
    list.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  const targetList = e.target.closest('.cat-mgr-list');
  if (!targetList) return;
  targetList.classList.remove('drag-over');

  // Find the item we're dropping on (for insertion point)
  const dropTarget = e.target.closest('.cat-item');
  if (!dragSource) return;

  const fromType = dragSource.dataset.type;
  const toType = targetList.dataset.type;
  const catName = dragSource.dataset.cat;

  if (fromType === toType && dragSource === dropTarget) return;

  const stored = loadCategories();

  // Remove from source
  stored[fromType] = stored[fromType].filter(c => c !== catName);

  // Add to target
  if (fromType !== toType) {
    stored[toType].push(catName);
  } else {
    // Reorder within same list
    const dropIndex = dropTarget
      ? Array.from(targetList.querySelectorAll('.cat-item')).indexOf(dropTarget)
      : stored[toType].length;
    stored[toType].splice(dropIndex, 0, catName);
  }

  saveCategories(stored);
  renderCategoryManager();
  showToast('Categories updated!', 'success');
}

// Expose drag handlers globally
window.addCategoryItem = function(type) {
  const input = document.getElementById('catInput' + type.charAt(0).toUpperCase() + type.slice(1));
  const name = input.value.trim();
  if (!name) {
    showToast('Please enter a category name', 'error');
    return;
  }

  // Check duplicate (case-insensitive)
  const stored = loadCategories();
  if (stored[type].some(c => c.toLowerCase() === name.toLowerCase())) {
    showToast('Category already exists!', 'error');
    return;
  }

  stored[type].push(name);
  saveCategories(stored);
  input.value = '';
  renderCategoryManager();
  if (typeIncome.checked === (type === 'income') || (!typeIncome.checked && type === 'expense')) {
    updateCategoryOptions();
  }
  showToast('Category added!', 'success');
};

window.deleteCategoryItem = function(type, cat) {
  const stored = loadCategories();
  stored[type] = stored[type].filter(c => c !== cat);
  saveCategories(stored);
  renderCategoryManager();
  updateCategoryOptions();
  showToast('Category removed', 'info');
};

window.resetAllCategories = function() {
  saveCategories({
    income: [...CATEGORIES.income],
    expense: [...CATEGORIES.expense]
  });
  renderCategoryManager();
  updateCategoryOptions();
  showToast('Categories reset to defaults', 'success');
};

// ========== TOAST ==========
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ========== EXPOSE HANDLERS ==========
window.handleDeleteClick = handleDeleteClick;
window.handleEditClick = handleEditClick;

// ========== DOWNLOAD REPORT ==========
function generateReport() {
  const incomeTotal = getIncomeTotal();
  const expenseTotal = getExpenseTotal();
  const balance = incomeTotal - expenseTotal;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');

  const categoryMap = {};
  expenses.forEach(t => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });
  const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const maxCatAmt = sortedCats.length ? sortedCats[0][1] : 1;

  const incomeCatMap = {};
  incomes.forEach(t => {
    const cat = t.category || 'Other';
    incomeCatMap[cat] = (incomeCatMap[cat] || 0) + t.amount;
  });
  const sortedIncomeCats = Object.entries(incomeCatMap).sort((a, b) => b[1] - a[1]);
  const maxIncomeCatAmt = sortedIncomeCats.length ? sortedIncomeCats[0][1] : 1;

  const sortedTxns = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  let catRows = '';
  sortedCats.forEach(([cat, amt]) => {
    const pct = ((amt / maxCatAmt) * 100).toFixed(0);
    catRows += `
      <div class="report-cat-bar">
        <span class="report-cat-name">${escHtml(cat)}</span>
        <div class="report-cat-bar-fill"><div class="report-cat-bar-inner" style="width:${pct}%;background:#ff6b6b;"></div></div>
        <span class="report-cat-amount">${formatCurrency(amt)}</span>
      </div>`;
  });

  let incomeCatRows = '';
  sortedIncomeCats.forEach(([cat, amt]) => {
    const pct = ((amt / maxIncomeCatAmt) * 100).toFixed(0);
    incomeCatRows += `
      <div class="report-cat-bar">
        <span class="report-cat-name">${escHtml(cat)}</span>
        <div class="report-cat-bar-fill"><div class="report-cat-bar-inner" style="width:${pct}%;background:#00b894;"></div></div>
        <span class="report-cat-amount">${formatCurrency(amt)}</span>
      </div>`;
  });

  let txnRows = '';
  sortedTxns.forEach((t, i) => {
    const isIncome = t.type === 'income';
    const prefix = isIncome ? '+' : '-';
    const cls = isIncome ? 'amount-income' : 'amount-expense';
    const badgeCls = isIncome ? 'income' : 'expense';
    const dt = new Date(t.date + 'T00:00:00');
    const dateDisplay = dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    txnRows += `
      <tr>
        <td>${i + 1}</td>
        <td><span class="report-type-badge ${badgeCls}">${t.type}</span></td>
        <td>${escHtml(t.description)}</td>
        <td>${escHtml(t.category)}</td>
        <td>${t.paymentMethod || '-'}</td>
        <td class="${cls}">${prefix}${formatCurrency(t.amount)}</td>
        <td>${dateDisplay}</td>
        <td>${escHtml(t.notes || '')}</td>
      </tr>`;
  });

  const highestInc = incomes.length ? Math.max(...incomes.map(t => t.amount)) : 0;
  const highestExp = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;
  const avgPerTxn = transactions.length ? (incomeTotal + expenseTotal) / transactions.length : 0;

  printReport.innerHTML = `
    <div class="report-header">
      <div class="report-logo"><i class="fas fa-wallet"></i>BudgetBeat</div>
      <div class="report-subtitle">Personal Finance Report</div>
      <div class="report-date">Generated on ${dateStr} at ${timeStr}</div>
    </div>

    <div class="report-section">
      <div class="report-section-title">Financial Summary</div>
      <div class="report-summary-grid">
        <div class="report-summary-item">
          <div class="label">Total Income</div>
          <div class="value income">${formatCurrency(incomeTotal)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Total Expenses</div>
          <div class="value expense">${formatCurrency(expenseTotal)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Net Balance</div>
          <div class="value ${balance >= 0 ? 'balance-pos' : 'balance-neg'}">${formatCurrency(balance)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Transactions</div>
          <div class="value" style="color:#2d3436;">${transactions.length}</div>
        </div>
      </div>
      <div class="report-summary-grid">
        <div class="report-summary-item">
          <div class="label">Highest Income</div>
          <div class="value income">${formatCurrency(highestInc)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Highest Expense</div>
          <div class="value expense">${formatCurrency(highestExp)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Avg per Transaction</div>
          <div class="value" style="color:#2d3436;">${formatCurrency(avgPerTxn)}</div>
        </div>
        <div class="report-summary-item">
          <div class="label">Account</div>
          <div class="value" style="color:#2d3436;font-size:13px;">${currentUser ? escHtml(currentUser.email) : '-'}</div>
        </div>
      </div>
    </div>

    ${sortedCats.length || sortedIncomeCats.length ? `
    <div class="report-section">
      <div class="report-section-title">Category Breakdown</div>
      <div class="report-category-grid">
        ${sortedCats.length ? `
        <div class="report-category-card">
          <h4><i class="fas fa-arrow-up" style="color:#ff6b6b;"></i> Expense Categories</h4>
          ${catRows}
        </div>` : ''}
        ${sortedIncomeCats.length ? `
        <div class="report-category-card">
          <h4><i class="fas fa-arrow-down" style="color:#00b894;"></i> Income Categories</h4>
          ${incomeCatRows}
        </div>` : ''}
      </div>
    </div>` : ''}

    ${sortedTxns.length ? `
    <div class="report-section">
      <div class="report-section-title">All Transactions (${sortedTxns.length})</div>
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${txnRows}</tbody>
      </table>
    </div>` : ''}

    <div class="report-footer">
      BudgetBeat &mdash; Personal Finance Manager &bull; Report generated automatically
    </div>`;
}

downloadReportBtn.addEventListener('click', () => {
  if (!transactions.length) {
    showToast('No transactions to export', 'info');
    return;
  }
  generateReport();
  setTimeout(() => window.print(), 200);
});
