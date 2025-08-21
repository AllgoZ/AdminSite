<template>
  <div class="wrapper">
    <!-- Sidebar (reused layout) -->
    <aside :class="['sidebar', { open: sidebarOpen }]">
      <div class="sidebar-header">
        <h2>AllGoZ Admin</h2>
        <button class="close-btn" @click="toggleSidebar">×</button>
      </div>
      <nav>
        <ul>
          <li><router-link to="/product-management" class="nav-link">Product Management</router-link></li>
          <li><router-link to="/overview-analytics" class="nav-link router-link-active">Overview & Analytics</router-link></li>
          <li><router-link to="/order-management" class="nav-link">Order Management</router-link></li>
          <li><router-link to="/customers" class="nav-link">Customers</router-link></li>
          <li><router-link to="/partners" class="nav-link">🤝 Partners</router-link></li>
          <li><router-link to="/settings" class="nav-link">👥 Settings</router-link></li>
          <li><router-link to="/earnings-expenses" class="nav-link">Earnings & Expenses</router-link></li>
        </ul>
      </nav>
    </aside> 

    <div class="analytics-page" :class="{ 'shifted': sidebarOpen }">
      <!-- Header -->
      <header class="header">
        <button class="hamburger" @click="toggleSidebar">☰</button>
        <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
        <h1>Overview & Analytics</h1>
      </header>

      <!-- Filters -->
      <div class="filters">
        <label for="range">Date Range:</label>
        <select v-model="selectedRange" @change="fetchSummary" id="range">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 3 Months</option>
          <option value="365">Last 12 Months</option>
        </select>
      </div>

  <div class="download-buttons">
    <h3>📥 Download Reports</h3>
    <div class="buttons">
      <button class="gradient-button" @click="exportCSV('orders')">📦 Order Report</button>
      <button class="gradient-button" @click="exportCSV('customers')">👥 Customer Report</button>
      <button class="gradient-button" @click="exportCSV('products')">🔥 Product Sales Report</button>
      <button class="gradient-button" @click="exportCSV('advanced')">📊 Advanced Order Report</button>
    </div>
  </div>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card" v-for="metric in summaryMetrics" :key="metric.title">
          <div class="icon-box" :class="metric.bg">
            <i :class="metric.icon"></i>
          </div>
          <div class="info">
            <span class="label">{{ metric.title }}</span>
            <h3>{{ metric.value }}</h3>
            <small :class="metric.trendClass">{{ metric.trend }}</small>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts">
        <div class="chart-card">
          <h3>📈 Revenue Growth</h3>
          <canvas id="revenueChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>👥 Customer Growth</h3>
          <canvas id="customerChart"></canvas>
        </div>
      </div>

      <!-- Top Products -->
  <div class="top-products">
    <h3>🏆 Top-Selling Products</h3>
    <div class="top-product-grid">
      <div v-for="product in topProducts.slice(0, 5)" :key="product.id" class="top-product-card">
        <img :src="product.imageURL || defaultImage" alt="product image" />
        <h4>{{ product.name }}</h4>
        <p>Sold: {{ product.sales }}</p>
        <p v-if="product.price !== '-'">₹{{ product.price }}</p>
      </div>
    </div>
  </div>
      <!-- Footer -->
      <footer class="footer">
        <p>AllGoZ Admin Panel</p>
      </footer>
    </div>
  </div>
</template>
<script>
import { db } from '@/firebase/firebase';
import {
  collection,
  getDocs,
  doc
} from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default {
  data() {
    return {
      sidebarOpen: false,
      selectedRange: '30',
      summaryMetrics: [],
      topProducts: [],
      allProducts: [],
      orderData: [],
      customerData: [],
      isLoading: true,
      defaultImage: 'https://via.placeholder.com/80x80.png?text=No+Image',
      revenueChartInstance: null,
      customerChartInstance: null,
      advancedOrderData: []
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    async fetchSummary() {
      this.isLoading = true;
      let totalRevenue = 0;
      let totalOrders = 0;
      const productSales = {};
      const dailyRevenue = {};
      const orderReport = [];
      const advancedReport = [];

      const customersSnap = await getDocs(collection(db, 'customers'));
      const usersSnap = await getDocs(collection(db, 'users'));
      const ordersParentSnap = await getDocs(collection(db, 'orders'));

      for (const parentDoc of ordersParentSnap.docs) {
        const orderSnap = await getDocs(collection(doc(db, 'orders', parentDoc.id), 'orders'));
        for (const docSnap of orderSnap.docs) {
          const order = docSnap.data();
          if (order.status !== 'Delivered') continue;

          const amount = order.totalAmount || 0;
          totalRevenue += amount;
          totalOrders++;

          const dateObj = order.orderDate?.toDate();
          const date = dateObj ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}` : '-';
          dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;

          const items = order.items || [];
          const productNames = items.map(i => `${i.name} x${i.quantity}`);

          orderReport.push([
            docSnap.id,
            order.customerName || '-',
            order.userPhoneNumber || '-',
            date,
            ...productNames,
            amount
          ]);

          for (const item of items) {
            advancedReport.push([
              docSnap.id,
              order.customerName || '-',
              date,
              item.name || '-',
              item.quantity || 0,
              item.price || '-',
              amount
            ]);

            const name = item.name || 'Unknown';
            const qty = item.quantity || 1;
            const id = item.id || `${name}-${qty}`;
            const key = `${name}_${id}`;
            if (!productSales[key]) {
              productSales[key] = {
                name,
                id,
                sales: 0,
                imageURL: item.imageURL || '',
                price: item.price || '-'
              };
            }
            productSales[key].sales += qty;
          }
        }
      }

      this.summaryMetrics = [
        {
          title: 'Total Revenue',
          value: `₹${totalRevenue.toFixed(2)}`,
          trend: '+18.2%',
          icon: 'ri-exchange-dollar-line',
          bg: 'bg-blue',
          trendClass: 'text-success'
        },
        {
          title: 'Delivered Orders',
          value: totalOrders,
          trend: '+7.2%',
          icon: 'ri-check-double-line',
          bg: 'bg-orange',
          trendClass: 'text-success'
        },
        {
          title: 'Customers',
          value: customersSnap.size,
          trend: '+10.1%',
          icon: 'ri-user-line',
          bg: 'bg-green',
          trendClass: 'text-success'
        },
        {
          title: 'Sellers',
          value: usersSnap.size,
          trend: '+3.6%',
          icon: 'ri-store-2-line',
          bg: 'bg-purple',
          trendClass: 'text-success'
        }
      ];

      this.topProducts = Object.values(productSales).sort((a, b) => b.sales - a.sales);
      this.allProducts = this.topProducts;
      this.orderData = orderReport;
      this.advancedOrderData = advancedReport;

      const labels = Object.keys(dailyRevenue);
      const series = Object.values(dailyRevenue);

      if (this.revenueChartInstance) this.revenueChartInstance.destroy();
      this.revenueChartInstance = new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Daily Revenue',
            data: series,
            backgroundColor: series.map(val => val > 1000 ? '#4caf50' : val > 500 ? '#ffa726' : '#ef5350')
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      });

      if (this.customerChartInstance) this.customerChartInstance.destroy();
      this.customerChartInstance = new Chart(document.getElementById('customerChart'), {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'New Customers',
            data: [12, 19, 7, 15, 23, 10],
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });

      this.isLoading = false;
    },

    exportCSV(type) {
      let rows = [];
      const BOM = '\uFEFF';
      if (type === 'orders') {
        rows.push(['Order ID', 'Customer', 'Phone', 'Date', 'Products...', 'Total Amount']);
        rows.push(...this.orderData);
      } else if (type === 'customers') {
        rows.push(['Customer ID', 'Name', 'Email', 'Referral']);
        this.customerData.forEach(c => {
          rows.push([c.customerId, c.name, c.email, c.referralCode || '']);
        });
      } else if (type === 'products') {
        rows.push(['Product Name', 'Product ID', 'Units Sold', 'Price']);
        this.allProducts.forEach(p => {
          rows.push([p.name, p.id, p.sales, p.price]);
        });
      } else if (type === 'advanced') {
        rows.push(['Order ID', 'Customer', 'Date', 'Product Name', 'Quantity', 'Price per Unit', 'Order Total']);
        rows.push(...this.advancedOrderData);
      }

      const csvContent = BOM + rows.map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
  mounted() {
    this.fetchSummary();
  }
};
</script>



<style scoped>

.download-buttons {
  background: linear-gradient(135deg, #f0f8ff, #e6f2ff);
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
}
.download-buttons h3 {
  font-size: 1.2rem;
  color: #1a3654;
  margin-bottom: 1rem;
}
.download-buttons .buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.gradient-button {
  background: linear-gradient(90deg, #007aff, #00c6ff);
  color: white;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 0.95rem;
}
.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}



body {
  background: linear-gradient(to right, #e0f7fa, #f0f8ff);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1a3654;
}
.wrapper {
  display: flex;
}
.sidebar {
  position: fixed;
  top: 0;
  left: -250px;
  width: 250px;
  height: 100vh;
  background: #1a3654;
  color: white;
  transition: left 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  padding-top: 0;
}
.sidebar.open {
  left: 0;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a3654;
  padding: 1rem;
  font-size: 18px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.close-btn {
  background: transparent;
  color: white;
  font-size: 24px;
  border: none;
  cursor: pointer;
}
.nav-link {
  display: block;
  padding: 1rem;
  color: white;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 4px solid #00d084;
  padding-left: 0.75rem;
}
.router-link-active.nav-link {
  background-color: #c4f8ff;
  color: #1a3654;
  font-weight: 600;
  border-left: 4px solid #00d084;
}
.analytics-page {
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  margin-left: 0;
  padding: 1rem;
  background: #c4f8ff;
}
.analytics-page.shifted {
  margin-left: 250px;
}
.header {
  display: flex;
  align-items: center;
  background-color: #1a3654;
  color: white;
  /* padding: 1rem; */
  border-radius: 10px;
  margin-bottom: 1.5rem;
}
.logo {
  width: 45px;
  margin-right: 1rem;
}
.filters {
  margin-bottom: 1.5rem;
}
.filters select {
  padding: 0.4rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
}

.card {
  background: linear-gradient(to bottom right, #beffa8, #0097ff);

  border-radius: 15px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card .icon-box {
  padding: 12px;
  border-radius: 50%;
  font-size: 22px;
}

.bg-blue { background: #e0f0ff; color: #007aff; }
.bg-green { background: #e0ffe0; color: #28a745; }
.bg-orange { background: #fff5e0; color: #ff9500; }
.bg-purple { background: #f0e0ff; color: #8e44ad; }

.card .info {
  display: flex;
  flex-direction: column;
}

.card .label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.card h3 {
  font-size: 1.4rem;
  font-weight: bold;
  color: #1a3654;
  margin: 0.3rem 0;
}

.card small.text-success {
  color: #28a745;
  font-weight: 500;
}
.bg-blue { background: #e0f0ff; color: #007aff; }
.bg-green { background: #e0ffe0; color: #28a745; }
.bg-orange { background: #fff5e0; color: #ff9500; }
.bg-purple { background: #f0e0ff; color: #8e44ad; }

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.chart-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.top-products {
  margin-top: 2rem;
}
.top-products h3 {
  margin-bottom: 1rem;
  font-weight: bold;
  font-size: 1.25rem;
  color: #1a3654;
  text-align: center;
}
.top-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
.top-product-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom right, #f0f8ff, #e6f2ff);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease;
}
.top-product-card:hover {
  transform: scale(1.03);
}
.top-product-card img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  border: 3px solid #007aff20;
}
.top-product-card h4 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.25rem;
  font-weight: 600;
}
.top-product-card p {
  margin: 0.1rem 0;
  font-size: 0.9rem;
  color: #555;
}
.loader {
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.product-card {
  display: flex;
  background: white;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.product-card img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 1rem;
}
.footer {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 14px;
}
.hamburger {
  background: transparent;
  border: none;
  font-size: 24px;
  color: white;
  margin-right: 1rem;
  cursor: pointer;
}
@media (max-width: 768px) {
  .hamburger {
    display: inline;
  }
  .analytics-page.shifted {
    margin-left: 0;
  }
}
</style>
