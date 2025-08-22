<template>
  <div class="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <!-- Header -->
    <header class="flex items-center justify-between p-4 bg-[var(--surface)] shadow-md sticky top-0 z-20">
      <h1 class="text-2xl font-semibold">Sales & Expense Dashboard</h1>
      <div class="flex items-center space-x-2">
        <select v-model="range" class="filter-select" aria-label="Date range">
          <option value="today">Today</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
        </select>
        <button @click="exportData" class="px-3 py-2 rounded-lg bg-primary text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary">Export</button>
        <button @click="toggleTheme" aria-label="Toggle theme" class="p-2 rounded-lg bg-[var(--surface)] hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
          <span v-if="theme==='light'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </div>
    </header>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 p-4 bg-[var(--surface)] shadow sticky top-16 z-10">
      <select v-model="filters.store" class="filter-select" aria-label="Store selector">
        <option value="">All Stores</option>
        <option>Store A</option>
        <option>Store B</option>
      </select>
      <select v-model="filters.category" class="filter-select" aria-label="Category filter">
        <option value="">Category</option>
        <option>Fruits</option>
        <option>Vegetables</option>
      </select>
      <select v-model="filters.method" class="filter-select" aria-label="Payment method filter">
        <option value="">Payment</option>
        <option>Cash</option>
        <option>UPI</option>
      </select>
      <select v-model="filters.status" class="filter-select" aria-label="Order status filter">
        <option value="">Status</option>
        <option>Pending</option>
        <option>Delivered</option>
      </select>
      <input v-model="filters.search" placeholder="Search" aria-label="Search" class="filter-select" />
      <button @click="resetFilters" class="px-4 py-2 rounded-full bg-secondary text-[var(--text)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary">Reset Filters</button>
    </div>

    <main class="p-4 space-y-8">
      <!-- KPI Cards -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div v-for="card in kpis" :key="card.title" class="p-4 rounded-2xl shadow bg-[var(--surface)] hover:shadow-lg transition-shadow" role="region" :aria-label="card.title">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ card.title }}</p>
              <p class="text-2xl font-bold">{{ card.prefix }}{{ card.value }}</p>
            </div>
            <span :class="card.trend >= 0 ? 'text-green-600' : 'text-red-600'" class="text-sm">
              {{ card.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(card.trend) }}%
            </span>
          </div>
          <canvas :id="card.id" class="h-12 mt-2" aria-hidden="true"></canvas>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="card">
          <h2 class="card-title">Sales Trend</h2>
          <canvas id="salesChart" aria-label="Sales trend chart" role="img"></canvas>
        </div>
        <div class="card">
          <h2 class="card-title">Expense Breakdown</h2>
          <canvas id="expenseChart" aria-label="Expense breakdown chart" role="img"></canvas>
        </div>
        <div class="card lg:col-span-2">
          <h2 class="card-title">Profit vs Expenses</h2>
          <canvas id="profitChart" aria-label="Profit versus expenses chart" role="img"></canvas>
        </div>
        <div class="card lg:col-span-2">
          <h2 class="card-title">Revenue by Category</h2>
          <canvas id="categoryChart" aria-label="Revenue by category chart" role="img"></canvas>
        </div>
      </div>

      <!-- Transactions -->
      <div>
        <div class="flex space-x-4 border-b mb-4">
          <button @click="tab='sales'" :class="tab==='sales' ? activeTab : inactiveTab">Sales</button>
          <button @click="tab='expenses'" :class="tab==='expenses' ? activeTab : inactiveTab">Expenses</button>
        </div>
        <div v-if="tab==='sales'">
          <table class="table-auto w-full text-left">
            <thead>
              <tr class="text-sm text-gray-500">
                <th class="p-2">Date/Time</th>
                <th class="p-2">Order ID</th>
                <th class="p-2">Customer</th>
                <th class="p-2">Items</th>
                <th class="p-2">Method</th>
                <th class="p-2">Status</th>
                <th class="p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in salesRows" :key="row.id" class="hover:bg-gray-50 cursor-pointer" @click="openOrder(row)">
                <td class="p-2">{{ row.date }}</td>
                <td class="p-2">{{ row.id }}</td>
                <td class="p-2">{{ row.customer }}</td>
                <td class="p-2">{{ row.items }}</td>
                <td class="p-2">{{ row.method }}</td>
                <td class="p-2"><span class="px-2 py-1 rounded-full text-xs" :class="statusClass(row.status)">{{ row.status }}</span></td>
                <td class="p-2">₹{{ row.amount }}</td>
              </tr>
              <tr v-if="!salesRows.length">
                <td colspan="7" class="p-4 text-center text-gray-500">No sales found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else>
          <table class="table-auto w-full text-left">
            <thead>
              <tr class="text-sm text-gray-500">
                <th class="p-2">Date</th>
                <th class="p-2">Type</th>
                <th class="p-2">Description</th>
                <th class="p-2">Mode</th>
                <th class="p-2">Amount</th>
                <th class="p-2">Added By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in expenseRows" :key="row.id" class="hover:bg-gray-50">
                <td class="p-2">{{ row.date }}</td>
                <td class="p-2">{{ row.type }}</td>
                <td class="p-2">{{ row.desc }}</td>
                <td class="p-2">{{ row.mode }}</td>
                <td class="p-2">₹{{ row.amount }}</td>
                <td class="p-2">{{ row.user }}</td>
              </tr>
              <tr v-if="!expenseRows.length">
                <td colspan="6" class="p-4 text-center text-gray-500">No expenses found</td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4">
            <button @click="showModal=true" class="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary">Add Expense</button>
          </div>
        </div>
      </div>

      <!-- Add Expense Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-30" role="dialog" aria-modal="true">
        <div class="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-lg">
          <h2 class="text-xl font-semibold mb-4">Add Expense</h2>
          <form @submit.prevent="saveExpense" class="space-y-3">
            <input v-model="expenseForm.date" type="date" class="filter-select w-full" aria-label="Date" required />
            <select v-model="expenseForm.type" class="filter-select w-full" aria-label="Expense type" required>
              <option disabled value="">Type</option>
              <option>Inventory</option>
              <option>Salaries</option>
              <option>Rent</option>
              <option>Utilities</option>
              <option>Delivery</option>
              <option>Marketing</option>
              <option>Misc</option>
            </select>
            <input v-model="expenseForm.desc" placeholder="Description" class="filter-select w-full" aria-label="Description" />
            <input v-model.number="expenseForm.amount" type="number" placeholder="Amount" class="filter-select w-full" aria-label="Amount" required />
            <select v-model="expenseForm.mode" class="filter-select w-full" aria-label="Payment mode" required>
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank</option>
            </select>
            <div class="flex justify-end space-x-2 pt-2">
              <button type="button" @click="showModal=false" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
              <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const theme = ref('light');
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme.value);
}

const range = ref('month');
const filters = ref({ store: '', category: '', method: '', status: '', search: '' });
function resetFilters() {
  filters.value = { store: '', category: '', method: '', status: '', search: '' };
}

const kpis = ref([
  { id: 'kpiSales', title: 'Total Sales', value: 0, trend: 0, prefix: '₹' },
  { id: 'kpiOrders', title: 'Orders', value: 0, trend: 0, prefix: '' },
  { id: 'kpiAov', title: 'Avg Order Value', value: 0, trend: 0, prefix: '₹' },
  { id: 'kpiExpense', title: 'Total Expenses', value: 0, trend: 0, prefix: '₹' },
  { id: 'kpiProfit', title: 'Net Profit', value: 0, trend: 0, prefix: '₹' },
  { id: 'kpiMargin', title: 'Profit Margin', value: 0, trend: 0, prefix: '%' }
]);

// Dummy data
const salesRows = ref([
  { id: 'ORD-1', date: '2024-01-01', customer: 'Alex', items: 3, method: 'UPI', status: 'Delivered', amount: 500 },
]);
const expenseRows = ref([]);

const tab = ref('sales');
const activeTab = 'pb-2 border-b-2 border-primary';
const inactiveTab = 'pb-2 text-gray-500';

function statusClass(status) {
  return status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
}

function exportData() {
  // placeholder for export logic
}

const showModal = ref(false);
const expenseForm = ref({ date: '', type: '', desc: '', amount: 0, mode: 'Cash' });
function saveExpense() {
  expenseRows.value.push({ ...expenseForm.value, id: Date.now(), user: 'Admin' });
  showModal.value = false;
  expenseForm.value = { date: '', type: '', desc: '', amount: 0, mode: 'Cash' };
}

function openOrder(row) {
  // placeholder for detailed view
  console.log(row);
}

onMounted(() => {
  kpis.value.forEach(kpi => {
    new Chart(document.getElementById(kpi.id), {
      type: 'line',
      data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [1,2,3,4,3,2,1], borderColor: 'var(--primary)', tension: 0.4, pointRadius: 0, fill: false }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
  });
  new Chart(document.getElementById('salesChart'), {
    type: 'line',
    data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ label: 'Sales', data: [10,20,30,25,40,35,50], borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', tension: 0.4 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  new Chart(document.getElementById('expenseChart'), {
    type: 'doughnut',
    data: { labels: ['Inventory','Salaries','Rent'], datasets: [{ data: [30,40,30], backgroundColor: ['var(--primary)','var(--secondary)','var(--accent)'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  new Chart(document.getElementById('profitChart'), {
    type: 'bar',
    data: { labels: ['Week 1','Week 2','Week 3','Week 4'], datasets: [{ label: 'Profit', data: [100,150,80,200], backgroundColor: 'var(--secondary)' }, { label: 'Expenses', data: [80,120,60,160], backgroundColor: 'var(--accent)' }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  new Chart(document.getElementById('categoryChart'), {
    type: 'bar',
    data: { labels: ['Fruits','Veggies','Dairy'], datasets: [{ label: 'Revenue', data: [200,150,80], backgroundColor: 'var(--primary)' }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });
});
</script>

<style scoped>
.card {
  @apply p-4 rounded-2xl shadow bg-[var(--surface)] hover:shadow-lg transition-shadow;
}
.card-title {
  @apply mb-2 text-lg font-semibold;
}
.filter-select {
  @apply border rounded-lg p-2 bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-primary;
}
</style>
