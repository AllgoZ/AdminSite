<template>
  <aside :class="['sidebar', { open: open }]">
    <div class="sidebar-header">
      <h2>AllGoZ Admin</h2>
      <button class="close-btn" @click="$emit('toggle')">×</button>
    </div>
    <nav>
      <ul>
        <li><router-link to="/product-management" class="nav-link">Product Management</router-link></li>
        <li><router-link to="/overview-analytics" class="nav-link">Overview & Analytics</router-link></li>
        <li><router-link to="/order-management" class="nav-link">Order Management</router-link></li>
        <li><router-link to="/customers" class="nav-link">Customers</router-link></li>
        <li><router-link to="/partners" class="nav-link">🤝 Partners</router-link></li>
        <li><router-link to="/settings" class="nav-link">⚙️ Settings</router-link></li>
        <li><router-link to="/earnings-expenses" class="nav-link">💰 Earnings & Expenses</router-link></li>
      </ul>
    </nav>
  </aside>
</template>


<script>
export default {
  props: {
    open: {
      type: Boolean,
      required: true
    }
  }
};
</script>


<style scoped>
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
</style>
