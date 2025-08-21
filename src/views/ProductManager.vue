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
          <li><router-link to="/earnings-expenses" class="nav-link">💰 Earnings & Expenses</router-link></li>
        </ul>
      </nav>
    </aside>

    <div class="product-manager" :class="{ 'shifted': sidebarOpen }">
      <header class="header">
        <button class="hamburger" @click="toggleSidebar">☰</button>
        <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
        <h1>Product Management</h1>
      </header>

      <div class="action-bar">
        <div class="buttons">
          <button class="btn" @click="goToNewProduct">➕ New Product</button>
          <button class="btn">✏️ Update</button>
          <button class="btn">⬇️ Download</button>
        </div>
        <div class="search-filter">
          <input v-model="searchQuery" placeholder="Search products..." class="search" />
          <select v-model="filterType" class="filter">
            <option value="">All Types</option>
            <option v-for="type in uniqueTypes" :key="type">{{ type }}</option>
          </select>
          <select v-model="filterCategory" class="filter">
            <option value="">All Categories</option>
            <option v-for="category in uniqueCategories" :key="category">{{ category }}</option>
          </select>
        </div>
      </div>

      <div class="product-list">
        <div class="product-card" v-for="(product, index) in filteredProducts" :key="product.id">
          <div class="details" @dblclick="product.editing = true">
             
            <h3>{{ index + 1 }}. {{ product.name }}</h3>
            
            <div v-if="product.editing">
              <label>
                PricePerKg:
                <input v-model.number="product.pricePerKg" type="number" class="price-input" @input="calculatePriceFromKg(product)" />
              </label>
              <label>
                Margin (%):
                <input v-model.number="product.margin" type="number" class="price-input" @input="calculatePriceFromKg(product)" />
              </label>
              <label>
                Price:
                <input v-model.number="product.price" type="number" class="price-input" />
              </label>
              <label>
                Quantity (g):
                <input v-model.number="product.quantity" type="number" class="price-input" @input="calculatePriceFromKg(product)" />
              </label>
              <button class="btn save-btn" @click="savePrice(product)">💾 Save</button>
            </div>
            <p v-else>Price : {{ product.price }}  ₹ | Qty: {{ product.quantity }}  {{ product.unit }}</p>
          </div>
          <div class="actions">
            <label class="toggle">
              <input type="checkbox" v-model="product.available" @change="toggleAvailability(product)" />
              <span class="slider"></span>
            </label>
            <button class="edit" @click="editProduct(product)">✎</button>
              <button class="delete" @click="confirmDelete(product)">🗑️</button>
          </div>
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
import { collectionGroup, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      products: [],
      searchQuery: '',
      filterType: '',
      filterCategory: '',
      sidebarOpen: false,
    };
  },
  computed: {
    uniqueTypes() {
      return [...new Set(this.products.map(p => p.type))];
    },
    uniqueCategories() {
      return [...new Set(this.products.map(p => p.category))];
    },
    filteredProducts() {
      return this.products.filter(p => {
        return (
          (!this.filterType || p.type === this.filterType) &&
          (!this.filterCategory || p.category === this.filterCategory) &&
          (!this.searchQuery || p.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
  },

  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    async fetchProducts() {
      const snapshot = await getDocs(collectionGroup(db, 'products'));
      this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), editing: false }));
    },
    async toggleAvailability(product) {
      const productRef = doc(db, `users/${product.sellerId}/products/${product.id}`);
      await updateDoc(productRef, {
        available: product.available,
      });
    },
    async savePrice(product) {
      const productRef = doc(db, `users/${product.sellerId}/products/${product.id}`);
      await updateDoc(productRef, {
        price: product.price,
        pricePerKg: product.pricePerKg || null,
        margin: product.margin || 0,
        quantity: product.quantity || 0,
      });
      product.editing = false;
    },
    calculatePriceFromKg(product) {
      const grams = parseFloat(product.quantity);
      const perKg = parseFloat(product.pricePerKg);
      const margin = parseFloat(product.margin) || 0;
      if (!isNaN(perKg) && !isNaN(grams)) {
        let basePrice = (perKg * grams) / 1000;
        product.price = Math.round(basePrice + (basePrice * margin / 100));
      }
    },
    editProduct(product) {
      this.$router.push({ name: 'EditProduct', params: { id: product.id, sellerId: product.sellerId } });
    },
    goToNewProduct() {
      this.$router.push({ name: 'NewProduct' });
    },

    // ✅ New: Confirm Delete and Delete Product Methods
    confirmDelete(product) {
      if (confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) {
        this.deleteProduct(product);
      }
    },
    async deleteProduct(product) {
      try {
        const productRef = doc(db, `users/${product.sellerId}/products/${product.id}`);
        await deleteDoc(productRef);
        this.products = this.products.filter(p => p.id !== product.id);
        alert('Product deleted successfully.');
      } catch (error) {
        console.error("Error deleting product:", error);
        alert('Failed to delete product.');
      }
    }
  },

  mounted() {
    this.fetchProducts();
  },
};
</script>

<style scoped>

.delete {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #e57373;
  transition: color 0.3s;
}
.delete:hover {
  color: #d32f2f;
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
.product-manager {
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  margin-left: 0;
}
.product-manager.shifted {
  margin-left: 250px;
}
.hamburger {
  background: transparent;
  border: none;
  font-size: 24px;
  color: white;
  margin-right: 1rem;
  cursor: pointer;
}





.price-input {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  width: 100px;
  margin: 0.3rem 0.5rem 0 0;
}
.save-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 14px;
}

.product-manager {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #c4f8ff, #c4f8ff);
  padding: 1rem;
  transition: margin-left 0.3s ease;
  font-family: 'Segoe UI', sans-serif;
}
.sidebar.open + .product-manager {
  margin-left: 250px; /* matches sidebar width */
}
.header {
  display: flex;
  
  align-items: center;
  padding: 1rem;
  background: #1a3654;
  color: white;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.logo {
  width: 45px;
  margin-right: 1rem;
}
.header h1 {
  font-size: 1.8rem;
  margin: 0;
}
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.buttons .btn {
  background: linear-gradient(145deg, #1a3654, #1a3654);
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: background 0.3s ease;
}
.buttons .btn:hover {
  background: #028802;
}
.buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.search, .filter {
  padding: 0.6rem;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 14px;
  min-width: 180px;
  background: #ffffff;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  transition: transform 0.2s;
}
.product-card:hover {
  transform: scale(1.01);
}
.details h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.1rem;
  color: #333;
}
.details p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  border-radius: 34px;
  transition: 0.4s;
}
.toggle input:checked + .slider {
  background-color: #09b224;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}
.toggle input:checked + .slider:before {
  transform: translateX(24px);
}
.edit {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #a6c2e1;
  transition: color 0.3s;
}
.edit:hover {
  color: #005fcc;
}
.footer {
  text-align: center;
  padding: 1.5rem 0;
  color: #777;
  font-size: 14px;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .action-bar, .buttons, .search-filter {
    flex-direction: column;
    align-items: flex-start;
  }
  .buttons .btn, .search, .filter {
    width: 100%;
  }
  .product-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .details, .actions {
    width: 100%;
  }
  .details h3 {
    font-size: 1rem;
  }
  .save-btn {
    margin-top: 0.5rem;
  }
}

/* existing styles... keep as is */
.price-input {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  width: 100px;
  margin: 0.3rem 0.5rem 0 0;
}
.save-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 14px;
}

</style>