<template>
  <div class="wrapper">
    <aside :class="['sidebar', { open: sidebarOpen }]">
      <div class="sidebar-header">
        <h2>AllGoZ Admin</h2>
        <button class="close-btn" @click="toggleSidebar">×</button>
      </div>
      <nav>
        <ul>
          <li><router-link to="/product-management" class="nav-link">Product Management</router-link></li>
          <li><router-link to="/overview-analytics" class="nav-link">Overview & Analytics</router-link></li>
          <li><router-link to="/order-management" class="nav-link">Order Management</router-link></li>
          <li><router-link to="/customers" class="nav-link">Customers</router-link></li>
          <li><router-link to="/partners" class="nav-link">🤝 Partners</router-link></li>
          <li><router-link to="/settings" class="nav-link">👥 Settings</router-link></li>
          <li><router-link to="/earnings-expenses" class="nav-link router-link-active">Earnings & Expenses</router-link></li>
        </ul>
      </nav>
    </aside>

    <div class="earnings-page" :class="{ shifted: sidebarOpen }">
      <header class="header">
        <button class="hamburger" @click="toggleSidebar">☰</button>
        <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
        <h1>Earnings & Expenses</h1>
      </header>

      <div class="filters">
        <input v-model="searchQuery" placeholder="Search..." class="search" />
        <select v-model="filterStore" class="filter">
          <option value="">All Stores</option>
          <option v-for="store in stores" :key="store" :value="store">{{ store }}</option>
        </select>
        <select v-model="filterCategory" class="filter">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="filterPayment" class="filter">
          <option value="">All Payments</option>
          <option v-for="pay in payments" :key="pay" :value="pay">{{ pay }}</option>
        </select>
        <select v-model="filterStatus" class="filter">
          <option value="">All Statuses</option>
          <option v-for="stat in statuses" :key="stat" :value="stat">{{ stat }}</option>
        </select>
        <button class="reset" @click="resetFilters">Reset Filters</button>
      </div>

      <div class="placeholder">
        <p>No data to display. Adjust filters or import records.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SalesExpenseDashboard',
  data() {
    return {
      sidebarOpen: false,
      searchQuery: '',
      filterStore: '',
      filterCategory: '',
      filterPayment: '',
      filterStatus: '',
      stores: ['Main Branch', 'Branch 2'],
      categories: ['Inventory', 'Salaries', 'Rent', 'Utilities'],
      payments: ['Cash', 'UPI', 'Bank'],
      statuses: ['Completed', 'Pending', 'Cancelled']
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    resetFilters() {
      this.searchQuery = '';
      this.filterStore = '';
      this.filterCategory = '';
      this.filterPayment = '';
      this.filterStatus = '';
    }
  }
};
</script>

<style scoped>
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
}
.sidebar.open {
  left: 0;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #1a3654;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
}
.router-link-active.nav-link {
  background-color: #c4f8ff;
  color: #1a3654;
  font-weight: 600;
  border-left: 4px solid #00d084;
}
.earnings-page {
  flex: 1;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}
.earnings-page.shifted {
  margin-left: 250px;
}
.header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #1a3654;
  color: white;
}
.hamburger {
  background: transparent;
  border: none;
  font-size: 24px;
  color: white;
  margin-right: 1rem;
  cursor: pointer;
}
.logo {
  height: 40px;
  margin-right: 1rem;
}
.filters {
  display: flex;
  gap: 0.5rem;
  margin: 1rem;
  flex-wrap: wrap;
}
.search,
.filter {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.reset {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 20px;
  background: #ddd;
  cursor: pointer;
}
.reset:hover {
  background: #ccc;
}
.placeholder {
  margin-top: 2rem;
  text-align: center;
  color: #777;
}
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
}
</style>
