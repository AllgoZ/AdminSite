<template>
  <div class="wrapper">
    <AppSidebar :open="sidebarOpen" @toggle="toggleSidebar" />

    <div class="dashboard" :class="{ shifted: sidebarOpen }">
      <AppHeader title="Sales & Expense Dashboard" @toggle="toggleSidebar" />

      <!-- Filters -->
      <div class="filters">
        <label>From
          <input type="date" v-model="filters.start" />
        </label>
        <label>To
          <input type="date" v-model="filters.end" />
        </label>
        <label>Store
          <select v-model="filters.store">
            <option value="">All Stores</option>
            <option v-for="s in stores" :key="s">{{ s }}</option>
          </select>
        </label>
        <label>Category
          <select v-model="filters.category">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </label>
        <button class="btn btn-primary" @click="applyFilters">Apply</button>
      </div>

      <!-- Summary -->
      <div class="summary-cards">
        <div class="card kpi kpi-primary">
          <div class="kpi-head">
            <h3>Total Sales</h3>
            <span class="dot dot-primary"></span>
          </div>
          <p class="kpi-value">₹{{ totalSales.toFixed(2) }}</p>
        </div>
        <div class="card kpi kpi-info">
          <div class="kpi-head">
            <h3>Orders</h3>
            <span class="dot dot-info"></span>
          </div>
          <p class="kpi-value">{{ numberOfOrders }}</p>
        </div>
        <div class="card kpi kpi-accent">
          <div class="kpi-head">
            <h3>Avg Order Value</h3>
            <span class="dot dot-accent"></span>
          </div>
          <p class="kpi-value">₹{{ avgOrderValue.toFixed(2) }}</p>
        </div>
        <div class="card kpi kpi-warning">
          <div class="kpi-head">
            <h3>Total Expenses</h3>
            <span class="dot dot-warning"></span>
          </div>
          <p class="kpi-value">₹{{ totalExpenses.toFixed(2) }}</p>
        </div>
        <div class="card kpi kpi-success">
          <div class="kpi-head">
            <h3>Net Profit</h3>
            <span class="dot dot-success"></span>
          </div>
          <p class="kpi-value" :class="netProfit >= 0 ? 'pos' : 'neg'">₹{{ netProfit.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts">
        <div class="chart-card">
          <div class="chart-title">
            <span class="chip chip-primary"></span>
            <h3>Sales Trend</h3>
          </div>
          <div class="chart-wrap">
            <canvas id="salesTrend"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="chip chip-warning"></span>
            <h3>Expense Breakdown</h3>
          </div>
          <div class="chart-wrap">
            <canvas id="expenseBreakdown"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="chip chip-success"></span>
            <h3>Profit Trend</h3>
          </div>
          <div class="chart-wrap">
            <canvas id="profitTrend"></canvas>
          </div>
        </div>
      </div>

      <!-- Expenses Section -->
      <section class="section">
        <div class="section-header">
          <div class="section-title">
            <span class="chip chip-warning"></span>
            <h2>Expenses</h2>
          </div>
          <div class="section-actions">
            <button class="btn btn-warning" @click="showExpenseForm = !showExpenseForm">
              {{ showExpenseForm ? 'Close' : 'Add Expense' }}
            </button>
            <div class="export-buttons">
              <button class="btn btn-outline" @click="exportCSV(expenses, 'expenses')">CSV</button>
              <button class="btn btn-outline" @click="exportExcel(expenses, 'expenses')">Excel</button>
              <button class="btn btn-outline" @click="exportPDF('expenseTable')">PDF</button>
            </div>
          </div>
        </div>

        <form v-if="showExpenseForm" class="expense-form" @submit.prevent="addExpense">
          <label>
            <span>Date</span>
            <input type="date" v-model="expenseForm.date" />
          </label>

          <label>
            <span>Type</span>
            <select v-model="expenseForm.type">
              <option disabled value="">Expense Type</option>
              <option v-for="t in expenseTypes" :key="t" :value="t">{{ t }}</option>
              <option value="new">+ New Type</option>
            </select>
          </label>

          <label v-if="expenseForm.type === 'new'">
            <span>New Type</span>
            <input type="text" v-model="expenseForm.customType" placeholder="Enter new expense type" />
          </label>

          <label class="span-2">
            <span>Description</span>
            <input type="text" v-model="expenseForm.description" placeholder="Description" />
          </label>

          <label>
            <span>Amount</span>
            <input type="number" v-model.number="expenseForm.amount" placeholder="Amount" />
          </label>

          <label>
            <span>Payment Mode</span>
            <select v-model="expenseForm.mode">
              <option disabled value="">Payment Mode</option>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank Transfer</option>
            </select>
          </label>

          <label>
            <span>Attachment</span>
            <input type="file" @change="onFileChange" />
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-warning">Save</button>
            <button type="button" class="btn btn-muted" @click="showExpenseForm=false">Cancel</button>
          </div>
        </form>

        <div class="table-wrap">
          <table id="expenseTable" class="table table-warning">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, idx) in expenses" :key="idx">
                <td>{{ e.date }}</td>
                <td><span class="tag">{{ e.type }}</span></td>
                <td>{{ e.description }}</td>
                <td>₹{{ Number(e.amount || 0).toFixed(2) }}</td>
                <td>{{ e.mode }}</td>
                <td>{{ e.addedBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Sales Section -->
      <section class="section">
        <div class="section-header">
          <div class="section-title">
            <span class="chip chip-primary"></span>
            <h2>Sales</h2>
          </div>
          <div class="section-actions">
            <div class="sales-filters">
              <label>Status
                <select v-model="salesStatusFilter">
                  <option value="">All</option>
                  <option>New</option>
                  <option>Confirmed</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </label>
            </div>
            <div class="export-buttons">
              <button class="btn btn-outline" @click="exportCSV(filteredSales, 'sales')">CSV</button>
              <button class="btn btn-outline" @click="exportExcel(filteredSales, 'sales')">Excel</button>
              <button class="btn btn-outline" @click="exportPDF('salesTable')">PDF</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table id="salesTable" class="table table-primary">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Breakdown</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredSales" :key="s.orderId">
                <td>{{ s.date }}</td>
                <td>{{ s.orderId }}</td>
                <td>{{ s.customer }}</td>
                <td>{{ s.items }}</td>
                <td>{{ s.breakdown }}</td>
                <td>{{ s.paymentMethod }}</td>
                <td>
                  <span class="badge"
                        :class="{
                          'badge-success': s.status==='Delivered',
                          'badge-info': s.status==='Confirmed' || s.status==='New',
                          'badge-warning': s.status==='In Transit',
                          'badge-danger': s.status==='Cancelled'
                        }">
                    {{ s.status || '—' }}
                  </span>
                </td>
                <td>₹{{ Number(s.amount || 0).toFixed(2) }}</td>
                <td>{{ s.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Monthly Summary -->
      <section class="monthly-summary">
        <h2>Monthly Report Summary</h2>
        <div class="summary-grid">
          <div class="summary-pill pill-primary">Total Sales <strong>₹{{ monthlySales.toFixed(2) }}</strong></div>
          <div class="summary-pill pill-warning">Total Expenses <strong>₹{{ monthlyExpenses.toFixed(2) }}</strong></div>
          <div class="summary-pill" :class="monthlyProfit >= 0 ? 'pill-success' : 'pill-danger'">
            Net Profit <strong>₹{{ monthlyProfit.toFixed(2) }}</strong>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import AppSidebar from '@/components/AppSidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
Chart.register(...registerables);

export default {
  name: 'EarningsExpenses',
  components: { AppSidebar, AppHeader, AppFooter },
  setup() {
    const sidebarOpen = ref(false);
    const filters = reactive({ start: '', end: '', store: '', category: '' });
    const stores = ref(['Main Branch', 'Outlet 2']);
    const categories = ref(['Fruits', 'Vegetables']);

    const sales = ref([]);
    const salesStatusFilter = ref('');
    const filteredSales = computed(() =>
      sales.value.filter(s => !salesStatusFilter.value || s.status === salesStatusFilter.value)
    );

    async function fetchSales(){
      const salesData = [];
      const ordersParentSnap = await getDocs(collection(db, 'orders'));
      for(const parentDoc of ordersParentSnap.docs){
        const orderSnap = await getDocs(collection(doc(db, 'orders', parentDoc.id), 'orders'));
        for(const docSnap of orderSnap.docs){
          const order = docSnap.data();
          const dateObj = order.orderDate?.toDate ? order.orderDate.toDate() : null;
          const date = dateObj ? dateObj.toISOString().slice(0,16).replace('T',' ') : (order.orderDate || '');
          const itemsArr = order.items || [];
          const breakdown = itemsArr.map(i=>`${i.name} x${i.quantity}`).join(', ');
          salesData.push({
            date,
            orderId: order.orderId || docSnap.id,
            customer: order.customerName || order.customerUID || '',
            items: itemsArr.length,
            breakdown,
            paymentMethod: order.paymentMethod || '',
            status: order.status || '',
            amount: Number(order.totalAmount) || 0,
            notes: order.notes || ''
          });
        }
      }
      sales.value = salesData;
    }

    const expenses = ref([]);

    const expenseForm = reactive({
      date: new Date().toISOString().slice(0,10),
      type: '',
      customType: '',
      description: '',
      amount: null,
      mode: '',
      attachment: null,
      addedBy: 'Admin'
    });

    const expenseTypes = ref(['Inventory','Salaries','Rent','Utilities','Delivery','Marketing','Misc']);
    const showExpenseForm = ref(false);

    function toggleSidebar(){ sidebarOpen.value = !sidebarOpen.value; }
    function applyFilters(){ /* hook Firestore where clauses if needed */ }
    function onFileChange(e){ expenseForm.attachment = e.target.files[0]; }

    function addExpense(){
      const type = expenseForm.type === 'new' ? expenseForm.customType : expenseForm.type;
      expenses.value.push({
        date: expenseForm.date,
        type,
        description: expenseForm.description,
        amount: expenseForm.amount,
        mode: expenseForm.mode,
        attachment: expenseForm.attachment,
        addedBy: expenseForm.addedBy
      });
      if(expenseForm.type === 'new' && expenseForm.customType){
        expenseTypes.value.push(expenseForm.customType);
      }
      expenseForm.date = new Date().toISOString().slice(0,10);
      expenseForm.type = '';
      expenseForm.customType = '';
      expenseForm.description = '';
      expenseForm.amount = null;
      expenseForm.mode = '';
      expenseForm.attachment = null;
      showExpenseForm.value = false;
      updateCharts();
    }

    // totals (revenue-style; delivered only)
    const totalSales = computed(() =>
      sales.value.reduce((sum, s) => {
        const amount = s.status === 'Delivered' ? Number(s.amount) || 0 : 0;
        return sum + amount;
      }, 0)
    );
    const numberOfOrders = computed(() =>
      sales.value.filter(s => s.status === 'Delivered').length
    );
    const avgOrderValue = computed(() =>
      numberOfOrders.value ? totalSales.value / numberOfOrders.value : 0
    );
    const totalExpenses = computed(() => expenses.value.reduce((sum,e)=>sum + Number(e.amount||0),0));
    const netProfit = computed(() => totalSales.value - totalExpenses.value);

    const monthlySales = computed(()=>totalSales.value);
    const monthlyExpenses = computed(()=>totalExpenses.value);
    const monthlyProfit = computed(()=>netProfit.value);

    function buildChart(ctx, config){ return new Chart(ctx, config); }

    let salesChart, expenseChart, profitChart;
    function updateCharts(){
      const delivered = sales.value.filter(s => s.status === 'Delivered');
      const salesDates = delivered.map(s=>s.date);
      const salesAmounts = delivered.map(s=>Number(s.amount || 0));

      const expenseTotals = expenseTypes.value.map(t =>
        expenses.value.filter(e=>e.type===t).reduce((sum,e)=>sum+Number(e.amount||0),0)
      );

      const profitData = salesAmounts.map((amt, idx)=> amt - (expenses.value[idx]?.amount || 0));

      if(salesChart){ salesChart.destroy(); }
      if(expenseChart){ expenseChart.destroy(); }
      if(profitChart){ profitChart.destroy(); }

      salesChart = buildChart(document.getElementById('salesTrend'), {
        type: 'line',
        data: {
          labels: salesDates,
          datasets: [{
            label: 'Revenue',
            data: salesAmounts,
            borderColor: '#2563EB',   // primary
            backgroundColor: 'rgba(37, 99, 235, .12)',
            pointBackgroundColor: '#2563EB',
            tension: .35,
            fill: true
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb'} }, x: { grid: { display: false } } }
        }
      });

      expenseChart = buildChart(document.getElementById('expenseBreakdown'), {
        type: 'doughnut',
        data: {
          labels: expenseTypes.value,
          datasets: [{
            data: expenseTotals,
            backgroundColor: ['#F59E0B','#10B981','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F97316'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
          cutout: '62%'
        }
      });

      profitChart = buildChart(document.getElementById('profitTrend'), {
        type: 'bar',
        data: {
          labels: salesDates,
          datasets: [{
            label: 'Profit (demo alignment)',
            data: profitData,
            backgroundColor: profitData.map(v => v >= 0 ? '#10B981' : '#EF4444')
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#e5e7eb'} },
            x: { grid: { display: false } }
          }
        }
      });
    }

    onMounted(async ()=>{ await fetchSales(); updateCharts(); });

    function exportCSV(data, name){
      const headers = Object.keys(data[0] || {});
      const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.csv`;
      link.click();
    }
    function exportExcel(data, name){ exportCSV(data, name + '.xls'); }
    function exportPDF(tableId){
      const el = document.getElementById(tableId);
      if(!el) return;
      const printContents = el.outerHTML;
      const win = window.open('', '', 'height=700,width=900');
      win.document.write('<html><head><title>Report</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style></head><body>');
      win.document.write(printContents);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }

    return {
      sidebarOpen, toggleSidebar,
      filters, stores, categories, applyFilters,
      sales, salesStatusFilter, filteredSales,
      expenses, expenseForm, expenseTypes, showExpenseForm, addExpense, onFileChange,
      totalSales, numberOfOrders, avgOrderValue, totalExpenses, netProfit,
      monthlySales, monthlyExpenses, monthlyProfit,
      exportCSV, exportExcel, exportPDF
    };
  }
};
</script>

<style scoped>
/* ========== COLOR SYSTEM (High-contrast) ========== */
:root{
  --bg:#0f172a;               /* slate-900 */
  --bg-soft:#111827;          /* gray-900 */
  --surface:#0b1220;          /* custom deep navy */
  --card:#111827;
  --card-2:#0f172a;

  --text:#e5e7eb;             /* gray-200 */
  --muted:#9ca3af;            /* gray-400 */

  --primary:#2563EB;          /* blue-600 */
  --primary-700:#1D4ED8;

  --info:#06B6D4;             /* cyan-500 */
  --accent:#8B5CF6;           /* violet-500 */
  --warning:#F59E0B;          /* amber-500 */
  --success:#10B981;          /* emerald-500 */
  --danger:#EF4444;           /* red-500 */

  --ring: rgba(37,99,235,.28);
  --shadow: 0 10px 30px rgba(0,0,0,.35);

  --radius:14px;
}

@media (prefers-color-scheme: light){
  :root{
    --bg:#f1f5f9;             /* slate-100 */
    --bg-soft:#f8fafc;        /* slate-50 */
    --surface:#ffffff;
    --card:#ffffff;
    --card-2:#f8fafc;

    --text:#0f172a;           /* slate-900 */
    --muted:#475569;          /* slate-600 */

    --shadow: 0 10px 30px rgba(2, 8, 20, .08);
  }
}

/* ========== LAYOUT ========== */
*{box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial}
.wrapper{display:flex;min-height:100vh}
.dashboard{width:100%;padding:20px 24px;transition:margin-left .25s ease;background:
  radial-gradient(800px 400px at -10% -10%, rgba(37,99,235,.18), transparent 50%),
  radial-gradient(800px 400px at 110% -10%, rgba(139,92,246,.15), transparent 50%),
  var(--bg);
}
.dashboard.shifted{margin-left:250px}

/* ========== FILTERS ========== */
.filters{
  display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 18px;padding:12px 12px;
  background:var(--surface);border:1px solid rgba(255,255,255,.08);
  border-radius:var(--radius);box-shadow:var(--shadow);
}
.filters label{display:grid;gap:6px;font-size:12px;color:var(--muted)}
.filters input[type="date"], .filters select{
  padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);
  background:var(--card-2);color:var(--text);outline:none;
}
.filters input:focus, .filters select:focus{box-shadow:0 0 0 3px var(--ring);border-color:var(--primary)}

/* ========== BUTTONS ========== */
.btn{
  font-weight:700;border-radius:10px;padding:10px 14px;cursor:pointer;border:1px solid transparent;
  transition:transform .05s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
}
.btn:active{transform:translateY(1px)}

.btn-primary{background:linear-gradient(180deg, var(--primary), var(--primary-700)); color:#fff;}
.btn-primary:hover{filter:brightness(1.05)}

.btn-warning{background:linear-gradient(180deg, #f59e0b, #d97706); color:#0b1220; border-color:#b45309;}
.btn-warning:hover{filter:brightness(1.05)}

.btn-muted{background:var(--card-2);color:var(--text);border:1px solid rgba(255,255,255,.15)}
.btn-outline{background:transparent;color:var(--text);border:1px solid rgba(255,255,255,.35)}
.btn-outline:hover{background:rgba(255,255,255,.06)}

/* ========== KPI CARDS ========== */
.summary-cards{
  display:grid;gap:16px;margin:14px 0 22px;
  grid-template-columns:repeat(auto-fit, minmax(220px,1fr));
}
.card{
  background:var(--card); border:1px solid rgba(255,255,255,.08); border-radius:var(--radius);
  box-shadow:var(--shadow); padding:16px 16px 14px;
}
.kpi-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.kpi h3{margin:0;font-size:12px;color:var(--muted);letter-spacing:.35px;text-transform:uppercase}
.kpi-value{margin:0;font-size:28px;font-weight:800}
.kpi .pos{color:var(--success)} .kpi .neg{color:var(--danger)}

.dot{width:10px;height:10px;border-radius:999px;display:inline-block}
.dot-primary{background:var(--primary)}
.dot-info{background:var(--info)}
.dot-accent{background:var(--accent)}
.dot-warning{background:var(--warning)}
.dot-success{background:var(--success)}

.kpi-primary{border-left:4px solid var(--primary)}
.kpi-info{border-left:4px solid var(--info)}
.kpi-accent{border-left:4px solid var(--accent)}
.kpi-warning{border-left:4px solid var(--warning)}
.kpi-success{border-left:4px solid var(--success)}

/* ========== CHARTS ========== */
.charts{
  display:grid;gap:16px;margin-bottom:24px;
  grid-template-columns:repeat(auto-fit, minmax(320px,1fr));
}
.chart-card{
  background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px;
}
.chart-title{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.chart-title h3{margin:0;font-size:14px}
.chip{width:10px;height:10px;border-radius:3px;display:inline-block}
.chip-primary{background:var(--primary)}
.chip-warning{background:var(--warning)}
.chip-success{background:var(--success)}
.chart-wrap{position:relative;min-height:260px}

/* ========== SECTIONS ========== */
.section{margin-top:18px}
.section-header{display:flex;align-items:center;justify-content:space-between;margin:10px 0}
.section-title{display:flex;align-items:center;gap:10px}
.section-title h2{margin:0}
.section-actions{display:flex;align-items:center;gap:10px}

/* ========== FORM ========== */
.expense-form{
  display:grid;grid-template-columns:repeat(6, minmax(160px,1fr));gap:12px;margin:12px 0 16px;padding:14px;
  background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);box-shadow:var(--shadow);
}
.expense-form label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted)}
.expense-form .span-2{grid-column:span 2}
.expense-form input, .expense-form select{
  padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);
  background:var(--card-2);color:var(--text);outline:none;
}
.expense-form input:focus, .expense-form select:focus{box-shadow:0 0 0 3px var(--ring); border-color:var(--primary)}
.form-actions{grid-column:1 / -1;display:flex;gap:10px}

/* ========== TABLES ========== */
.table-wrap{overflow:auto}
.table{
  width:100%;border-collapse:separate;border-spacing:0;background:var(--card);
  border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;
}
.table thead th{
  color:#fff;padding:12px;font-size:12px;letter-spacing:.4px;text-transform:uppercase;
}
.table-primary thead{background:linear-gradient(90deg, #2563EB, #1D4ED8)}
.table-warning thead{background:linear-gradient(90deg, #f59e0b, #d97706)}

.table tbody td{padding:12px;color:var(--text);border-bottom:1px solid rgba(255,255,255,.06)}
.table tbody tr:nth-child(odd){background:rgba(255,255,255,.02)}
.table tbody tr:hover{background:rgba(37,99,235,.08)}
.tag{
  display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;
  background:rgba(245,158,11,.18); color:#fbbf24; font-weight:700; font-size:12px;
}

/* ========== BADGES ========== */
.badge{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;
  font-weight:800;font-size:12px;color:#0b1220;
}
.badge-success{background:linear-gradient(180deg, #10B981, #059669); color:#062e26}
.badge-info{background:linear-gradient(180deg, #06B6D4, #0891B2); color:#052a33}
.badge-warning{background:linear-gradient(180deg, #F59E0B, #D97706); color:#3b2102}
.badge-danger{background:linear-gradient(180deg, #EF4444, #DC2626); color:#340707}

/* ========== MONTHLY SUMMARY ========== */
.monthly-summary{
  background:var(--card);border:1px solid rgba(255,255,255,.08);box-shadow:var(--shadow);
  border-radius:var(--radius);padding:16px;margin-top:18px;
}
.summary-grid{
  display:grid;gap:10px;grid-template-columns:repeat(auto-fit, minmax(220px,1fr));margin-top:10px;
}
.summary-pill{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  background:var(--card-2);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:10px 14px;
}
.pill-primary{border-color:rgba(37,99,235,.6)}
.pill-warning{border-color:rgba(245,158,11,.6)}
.pill-success{border-color:rgba(16,185,129,.6)}
.pill-danger{border-color:rgba(239,68,68,.6)}

/* ========== RESPONSIVE ========== */
@media (max-width:1024px){
  .expense-form{grid-template-columns:repeat(3, minmax(160px,1fr))}
  .expense-form .span-2{grid-column:span 3}
}
@media (max-width:640px){
  .filters{padding:10px}
  .summary-cards{grid-template-columns:repeat(2, minmax(160px,1fr))}
  .kpi-value{font-size:22px}
  .charts{grid-template-columns:1fr}
  .expense-form{grid-template-columns:1fr}
}
</style>
