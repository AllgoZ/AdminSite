<template>
  <div class="wrapper">
    <AppSidebar :open="sidebarOpen" @toggle="toggleSidebar" />
    <div class="dashboard" :class="{ shifted: sidebarOpen }">
      <AppHeader title="Sales & Expense Dashboard" @toggle="toggleSidebar" />

      <!-- Filters -->
      <div class="filters">
        <label>From:
          <input type="date" v-model="filters.start" />
        </label>
        <label>To:
          <input type="date" v-model="filters.end" />
        </label>
        <label>Store:
          <select v-model="filters.store">
            <option value="">All Stores</option>
            <option v-for="s in stores" :key="s">{{ s }}</option>
          </select>
        </label>
        <label>Category:
          <select v-model="filters.category">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </label>
        <button @click="applyFilters">Apply</button>
      </div>

      <!-- Summary -->
      <div class="summary-cards">
        <div class="card">
          <h3>Total Sales</h3>
          <p>₹{{ totalSales }}</p>
        </div>
        <div class="card">
          <h3>Orders</h3>
          <p>{{ numberOfOrders }}</p>
        </div>
        <div class="card">
          <h3>Avg Order Value</h3>
          <p>₹{{ avgOrderValue.toFixed(2) }}</p>
        </div>
        <div class="card">
          <h3>Total Expenses</h3>
          <p>₹{{ totalExpenses }}</p>
        </div>
        <div class="card">
          <h3>Net Profit</h3>
          <p>₹{{ netProfit }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts">
        <div class="chart-card">
          <h3>Sales Trend</h3>
          <canvas id="salesTrend"></canvas>
        </div>
        <div class="chart-card">
          <h3>Expense Breakdown</h3>
          <canvas id="expenseBreakdown"></canvas>
        </div>
        <div class="chart-card">
          <h3>Profit Trend</h3>
          <canvas id="profitTrend"></canvas>
        </div>
      </div>

      <!-- Expenses Section -->
      <section class="expenses">
        <div class="section-header">
          <h2>Expenses</h2>
          <button class="btn" @click="showExpenseForm = !showExpenseForm">{{ showExpenseForm ? 'Close' : 'Add Expense' }}</button>
          <div class="export-buttons">
            <button @click="exportCSV(expenses, 'expenses')">CSV</button>
            <button @click="exportExcel(expenses, 'expenses')">Excel</button>
            <button @click="exportPDF('expenseTable')">PDF</button>
          </div>
        </div>

        <form v-if="showExpenseForm" class="expense-form" @submit.prevent="addExpense">
          <input type="date" v-model="expenseForm.date" />
          <select v-model="expenseForm.type">
            <option disabled value="">Expense Type</option>
            <option v-for="t in expenseTypes" :key="t">{{ t }}</option>
          </select>
          <input type="text" v-model="expenseForm.description" placeholder="Description" />
          <input type="number" v-model.number="expenseForm.amount" placeholder="Amount" />
          <select v-model="expenseForm.mode">
            <option disabled value="">Payment Mode</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Bank Transfer</option>
          </select>
          <input type="file" @change="onFileChange" />
          <button type="submit">Save</button>
        </form>

        <table id="expenseTable">
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
              <td>{{ e.type }}</td>
              <td>{{ e.description }}</td>
              <td>₹{{ e.amount }}</td>
              <td>{{ e.mode }}</td>
              <td>{{ e.addedBy }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Sales Section -->
      <section class="sales">
        <div class="section-header">
          <h2>Sales</h2>
          <div class="export-buttons">
            <button @click="exportCSV(sales, 'sales')">CSV</button>
            <button @click="exportExcel(sales, 'sales')">Excel</button>
            <button @click="exportPDF('salesTable')">PDF</button>
          </div>
        </div>

        <table id="salesTable">
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
            <tr v-for="s in sales" :key="s.orderId">
              <td>{{ s.date }}</td>
              <td>{{ s.orderId }}</td>
              <td>{{ s.customer }}</td>
              <td>{{ s.items }}</td>
              <td>{{ s.breakdown }}</td>
              <td>{{ s.paymentMethod }}</td>
              <td>{{ s.status }}</td>
              <td>₹{{ s.amount }}</td>
              <td>{{ s.notes }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Monthly Summary -->
      <section class="monthly-summary">
        <h2>Monthly Report Summary</h2>
        <p>Total Sales: ₹{{ monthlySales }}</p>
        <p>Total Expenses: ₹{{ monthlyExpenses }}</p>
        <p>Net Profit: ₹{{ monthlyProfit }}</p>
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
  components: {
    AppSidebar,
    AppHeader,
    AppFooter
  },
  setup() {
    const sidebarOpen = ref(false);
    const filters = reactive({ start: '', end: '', store: '', category: '' });
    const stores = ref(['Main Branch', 'Outlet 2']);
    const categories = ref(['Fruits', 'Vegetables']);

    const sales = ref([]);
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
            amount: order.totalAmount || 0,
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
      description: '',
      amount: null,
      mode: '',
      attachment: null,
      addedBy: 'Admin'
    });

    const expenseTypes = ['Inventory','Salaries','Rent','Utilities','Delivery','Marketing','Misc'];
    const showExpenseForm = ref(false);

    function toggleSidebar(){
      sidebarOpen.value = !sidebarOpen.value;
    }

    function applyFilters(){
      // placeholder: in real app fetch filtered data
    }

    function onFileChange(e){
      expenseForm.attachment = e.target.files[0];
    }

    function addExpense(){
      expenses.value.push({ ...expenseForm });
      expenseForm.date = new Date().toISOString().slice(0,10);
      expenseForm.type = '';
      expenseForm.description = '';
      expenseForm.amount = null;
      expenseForm.mode = '';
      expenseForm.attachment = null;
      showExpenseForm.value = false;
      updateCharts();
    }

    const totalSales = computed(() => sales.value.reduce((sum,s) => sum + s.amount,0));
    const numberOfOrders = computed(() => sales.value.length);
    const avgOrderValue = computed(() => numberOfOrders.value ? totalSales.value/numberOfOrders.value : 0);
    const totalExpenses = computed(() => expenses.value.reduce((sum,e)=>sum + Number(e.amount||0),0));
    const netProfit = computed(() => totalSales.value - totalExpenses.value);

    const monthlySales = computed(()=>totalSales.value);
    const monthlyExpenses = computed(()=>totalExpenses.value);
    const monthlyProfit = computed(()=>netProfit.value);

    function buildChart(ctx, config){
      return new Chart(ctx, config);
    }

    let salesChart, expenseChart, profitChart;
    function updateCharts(){
      const salesDates = sales.value.map(s=>s.date);
      const salesAmounts = sales.value.map(s=>s.amount);
      const expenseTotals = expenseTypes.map(t => expenses.value.filter(e=>e.type===t).reduce((sum,e)=>sum+Number(e.amount||0),0));
      const profitData = salesAmounts.map((amt, idx)=> amt - (expenses.value[idx]?.amount || 0));

      if(salesChart){ salesChart.destroy(); }
      if(expenseChart){ expenseChart.destroy(); }
      if(profitChart){ profitChart.destroy(); }

      salesChart = buildChart(document.getElementById('salesTrend'), {
        type: 'line',
        data: { labels: salesDates, datasets: [{ label: 'Sales', data: salesAmounts, borderColor: '#007aff', fill:false }] }
      });
      expenseChart = buildChart(document.getElementById('expenseBreakdown'), {
        type: 'pie',
        data: { labels: expenseTypes, datasets: [{ data: expenseTotals, backgroundColor:['#ff6384','#36a2eb','#ffcd56','#4bc0c0','#9966ff','#c9cbcf','#f87979'] }] }
      });
      profitChart = buildChart(document.getElementById('profitTrend'), {
        type: 'line',
        data: { labels: salesDates, datasets: [{ label: 'Profit', data: profitData, borderColor: '#28a745', fill:false }] }
      });
    }

    onMounted(async ()=>{
      await fetchSales();
      updateCharts();
    });

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
    function exportExcel(data, name){
      exportCSV(data, name + '.xls');
    }
    function exportPDF(tableId){
      const printContents = document.getElementById(tableId).outerHTML;
      const win = window.open('', '', 'height=700,width=900');
      win.document.write('<html><head><title>Report</title></head><body>');
      win.document.write(printContents);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }

    return {
      sidebarOpen, toggleSidebar,
      filters, stores, categories, applyFilters,
      sales, expenses, expenseForm, expenseTypes, showExpenseForm, addExpense, onFileChange,
      totalSales, numberOfOrders, avgOrderValue, totalExpenses, netProfit,
      monthlySales, monthlyExpenses, monthlyProfit,
      exportCSV, exportExcel, exportPDF
    };
  }
};
</script>

<style scoped>
.wrapper { display: flex; }
.dashboard { margin-left:0; padding:1rem 2rem; width:100%; }
.dashboard.shifted { margin-left:250px; }
.filters { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
.summary-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; margin-bottom:1.5rem; }
.card { background:white; padding:1rem; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05); text-align:center; }
.charts { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1rem; margin-bottom:2rem; }
.chart-card { background:white; padding:1rem; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05); }
.section-header { display:flex; align-items:center; justify-content:space-between; margin:1rem 0; }
.expense-form, .filters label { display:flex; flex-direction:column; }
.expense-form { gap:.5rem; margin-bottom:1rem; }
.expense-form input, .expense-form select { padding:.5rem; }
.btn { padding:.5rem 1rem; background:#007aff; color:white; border:none; border-radius:4px; cursor:pointer; }
.export-buttons button { margin-left:.5rem; }
.expenses table, .sales table { width:100%; border-collapse:collapse; background:white; }
.expenses th, .expenses td, .sales th, .sales td { border:1px solid #ddd; padding:.5rem; text-align:left; }
.monthly-summary { background:white; padding:1rem; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05); margin-top:2rem; }
</style>

