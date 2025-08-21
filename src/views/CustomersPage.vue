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
          <li><router-link to="/customers" class="nav-link router-link-active">Customers</router-link></li>
          <li><router-link to="/partners" class="nav-link">🤝 Partners</router-link></li>
          <li><router-link to="/settings" class="nav-link">⚙️ Settings</router-link></li>
          <li><router-link to="/earnings-expenses" class="nav-link">Earnings & Expenses</router-link></li>
        </ul>
      </nav>
    </aside>

    <div class="customers-page" :class="{ shifted: sidebarOpen }">
      <header class="header">
        <button class="hamburger" @click="toggleSidebar">☰</button>
        <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
        <h1>Customers</h1>
      </header>

      <div class="customers-content">
        <div class="customer-list">
          <div class="filters">
            <input v-model="searchQuery" placeholder="Search customers..." class="search" />
            <input type="date" v-model="filterDate" class="date-filter" />
          </div>
          <ul>
            <li
              v-for="(customer, index) in filteredCustomers"
              :key="customer.id"
              @click="selectCustomer(customer)"
              :class="[
                { selected: selectedCustomer && selectedCustomer.id === customer.id },
                { new: isNewCustomer(customer) }
              ]"
            >
              <span class="index">{{ index + 1 }}.</span>
              {{ customer.name }} ({{ customer.uniqueId }})
              <span v-if="isNewCustomer(customer)" class="badge">New</span>
            </li>
          </ul>
        </div>

        <div class="customer-details" v-if="selectedCustomer">
          <h2>{{ selectedCustomer.name }} - {{ selectedCustomer.uniqueId }}</h2>
          <p><strong>UID:</strong> {{ selectedCustomer.uid }}</p>

          <h3>Cart Items</h3>
          <ul>
            <li v-for="(item, idx) in selectedCustomer.cart" :key="idx">
              <span v-if="typeof item === 'string'">{{ item }}</span>
              <span v-else>{{ item.name }} - {{ item.quantity }} {{ item.unit }} - ₹{{ item.price }}</span>
            </li>
          </ul>

          <h3>Orders ({{ filteredOrders.length }})</h3>
          <div class="order-filters">
            <input v-model="orderSearch" placeholder="Search orders..." class="search" />
            <input type="date" v-model="orderFilterDate" class="date-filter" />
          </div>
          <ul class="orders">
            <li
              v-for="order in filteredOrders"
              :key="order.orderId"
              @click="selectOrder(order)"
              :class="{ selected: selectedOrder && selectedOrder.orderId === order.orderId }"
            >
              {{ order.orderId }} - {{ formatDate(order.orderDate) }} - ₹{{ order.totalAmount }}
            </li>
          </ul>

          <div v-if="selectedOrder" class="order-details">
            <h4>Order {{ selectedOrder.orderId }}</h4>
            <p><strong>Date:</strong> {{ formatDate(selectedOrder.orderDate) }}</p>
            <p><strong>Status:</strong> {{ selectedOrder.status }}</p>
            <p><strong>Payment:</strong> {{ selectedOrder.paymentMethod }}</p>
            <p><strong>Total:</strong> ₹{{ selectedOrder.totalAmount }}</p>
            <h5>Items</h5>
            <ul>
              <li v-for="(item, i) in selectedOrder.items" :key="i">
                {{ item.name }} - {{ item.quantity }} {{ item.unit }} - ₹{{ item.price }}
              </li>
            </ul>
          </div>
        </div>
        <div class="customer-details placeholder" v-else>
          <p>Select a customer to view details</p>
        </div>
      </div>

      <footer class="footer">
        <p>AllGoZ Admin Panel</p>
      </footer>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default {
  data() {
    return {
      customers: [],
      searchQuery: '',
      filterDate: '',
      sidebarOpen: false,
      selectedCustomer: null,
      orders: [],
      orderSearch: '',
      orderFilterDate: '',
      selectedOrder: null
    };
  },
  computed: {
    filteredCustomers() {
      return this.customers.filter((c) => {
        const matchesSearch =
          !this.searchQuery ||
          c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (c.uniqueId && c.uniqueId.toLowerCase().includes(this.searchQuery.toLowerCase()));
        const matchesDate =
          !this.filterDate ||
          (c.createdAt && c.createdAt.toISOString().slice(0, 10) >= this.filterDate);
        return matchesSearch && matchesDate;
      });
    },
    filteredOrders() {
      return this.orders.filter((o) => {
        const matchesSearch =
          !this.orderSearch ||
          o.orderId.toLowerCase().includes(this.orderSearch.toLowerCase());
        const orderDate = o.orderDate
          ? o.orderDate.toDate
            ? o.orderDate.toDate()
            : new Date(o.orderDate.seconds * 1000)
          : null;
        const matchesDate =
          !this.orderFilterDate ||
          (orderDate && orderDate.toISOString().slice(0, 10) >= this.orderFilterDate);
        return matchesSearch && matchesDate;
      });
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    async fetchCustomers() {
      const snap = await getDocs(collection(db, 'customers'));
      this.customers = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : null
        };
      });
    },
    formatDate(ts) {
      if (!ts) return '';
      const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
      return date.toLocaleString();
    },
    async selectCustomer(customer) {
      this.selectedCustomer = customer;
      this.selectedOrder = null;
      const ordersRef = collection(db, 'orders', customer.customerId || customer.id, 'orders');
      const snap = await getDocs(ordersRef);
      this.orders = snap.docs
        .map((d) => d.data())
        .sort((a, b) => (b.orderDate?.seconds || 0) - (a.orderDate?.seconds || 0));
    },
    selectOrder(order) {
      this.selectedOrder = order;
    },
    isNewCustomer(customer) {
      if (!customer.createdAt) return false;
      const now = Date.now();
      return now - customer.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    }
  },
  created() {
    this.fetchCustomers();
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
.customers-page {
  flex: 1;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}
.customers-page.shifted {
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
.customers-content {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}
.customer-list {
  width: 30%;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.customer-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.customer-list li {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.customer-list li:hover {
  background: #f1f7ff;
}
.customer-list li.selected {
  background: #c4f8ff;
}
.customer-list li.new {
  background: #e0ffd4;
}
.badge {
  background: #ff7f50;
  color: #fff;
  font-size: 12px;
  padding: 0 4px;
  margin-left: 0.5rem;
  border-radius: 3px;
}
.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.search,
.date-filter {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex: 1;
}
.customer-details {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}
.orders li {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.orders li.selected {
  background: #c4f8ff;
}
.order-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.order-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}
.customer-details.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
}
.footer {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 14px;
}
</style>

