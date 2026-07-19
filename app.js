// ============================================================
// BudgetBeat - Personal Finance Manager
// Income & Expense tracking with charts, filters & local storage
// ============================================================

// ========== STATE ==========
let transactions = [];
let deleteTargetId = null;
let currentEditId = null;
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
const statIncome = $('#statIncome');
const statExpense = $('#statExpense');
const statBalance = $('#statBalance');
const statHighestIncome = $('#statHighestIncome');
const statHighestExpense = $('#statHighestExpense');
const statCount = $('#statCount');

// Current Date
const currentDateSpan = $('#currentDate');

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
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
  renderAll();
});

// ========== LOCAL STORAGE ==========
function loadTransactions() {
  try {
    const data = localStorage.getItem('budgetbeat_transactions');
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
  localStorage.setItem('budgetbeat_transactions', JSON.stringify(transactions));
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

// ========== INCOME VS EXPENSE CHART (Doughnut) ==========
function renderIncomeVsExpenseChart(incomeTotal, expenseTotal) {
  const canvas = document.getElementById('incomeVsExpenseChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstances.incomeVsExpense) {
    chartInstances.incomeVsExpense.destroy();
  }

  if (incomeTotal === 0 && expenseTotal === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  chartInstances.incomeVsExpense = new Chart(ctx, {
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
  const period = parseInt(analyticsPeriod.value);
  const isAll = analyticsPeriod.value === 'all';

  let filtered = isAll ? [...transactions] : [];
  if (!isAll) {
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
  analytics: { title: 'Analytics', subtitle: 'Deep insights into your finances', icon: 'chart-line' }
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

  // Initial style
  setTimeout(updateTypeStyle, 50);

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
  const cats = isIncome ? CATEGORIES.income : CATEGORIES.expense;
  const currentValue = categorySelect.value;

  categorySelect.innerHTML = '<option value="">Select Category</option>' +
    cats.map(c => {
      const iconMap = {
        'Salary': '💼', 'Freelance': '💻', 'Investments': '📈', 'Gifts': '🎁',
        'Business': '🏪', 'Rental Income': '🏠', 'Dividends': '🪙', 'Other Income': '📦',
        'Food & Drinks': '🍔', 'Transportation': '🚗', 'Shopping': '🛍️',
        'Bills & Utilities': '💡', 'Entertainment': '🎬', 'Health': '💊',
        'Education': '📚', 'Rent': '🏠', 'Savings': '💰', 'Other': '📦'
      };
      const icon = iconMap[c] || '📦';
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
  $$('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      const cat = btn.dataset.cat;
      const type = btn.dataset.type || 'expense';

      const data = {
        type,
        description: btn.querySelector('span').textContent,
        amount,
        category: cat,
        date: getToday(),
        paymentMethod: 'Cash',
        notes: ''
      };
      addTransaction(data);
    });
  });
}

// ========== ANALYTICS PERIOD ==========
function initAnalytics() {
  analyticsPeriod.addEventListener('change', renderAnalytics);
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
