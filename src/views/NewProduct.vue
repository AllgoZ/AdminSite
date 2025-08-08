<template>
  <div class="new-product-page full-width">
    <header class="header">
      <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
      <h1>Add New Product</h1>
    </header>

    <div class="top-actions">
      <button class="btn back-btn" @click="$router.push({ name: 'ProductManager' })">🔙 Back</button>
      <button class="btn bulk-btn" @click="goToBulkAdd">📦 Bulk Add</button>
    </div>

    <div class="form-container wide">
      <form @submit.prevent="submitProduct">
        <div class="row">
          <div class="form-group half">
            <label>Category:</label>
            <select v-model="product.category" class="colored-field">
              <option disabled value="">Select Category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="form-group half">
            <label>Type:</label>
              <select v-model="product.type" class="colored-field">
                <option disabled value="">Select Type</option>
                <option v-for="type in types" :key="type.id" :value="type.name">{{ type.name }}</option>
              </select>
          </div>
        </div>

        <div class="row" v-if="subcategories.length">
          <div class="form-group half">
            <label>Subcategory:</label>
            <select v-model="product.subcategory" class="colored-field">
              <option disabled value="">Select Subcategory</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.name">{{ sub.name }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="form-group half">
            <label>Product Name:</label>
            <input v-model="product.name" type="text" required class="colored-field" />
          </div>
          <div class="form-group half">
            <label>Seller:</label>
            <select v-model="product.sellerId" class="colored-field">
              <option v-for="user in sellers" :key="user.id" :value="user.id">
                {{ user.ownerName }} - {{ user.storeName }}
              </option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="form-group half">
            <label>Quantity:</label>
            <input v-model.number="product.quantity" type="number" required class="colored-field" />
          </div>
          <div class="form-group half">
            <label>Unit:</label>
            <select v-model="product.unit" class="colored-field">
              <option value="Gram">Gram</option>
              <option value="Kg">Kg</option>
              <option value="Liter">Liter</option>
              <option value="ml">ml</option>
              <option value="piece">piece</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="form-group third">
            <label>Price Per Kg:</label>
            <input v-model.number="product.pricePerKg" type="number" class="colored-field" @input="calculatePrice" />
          </div>
          <div class="form-group third">
            <label>Margin (%):</label>
            <input v-model.number="product.margin" type="number" class="colored-field" @input="calculatePrice" />
          </div>
          <div class="form-group third">
            <label>Price:</label>
            <input v-model.number="product.price" type="number" required class="colored-field" />
          </div>
        </div>

        <div class="form-group">
          <label>Discount (%):</label>
          <input v-model.number="product.discount" type="number" class="colored-field" />
        </div>

        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="product.description" class="colored-field"></textarea>
        </div>

        <div class="form-group">
          <label>Tags (comma separated):</label>
          <input v-model="product.tags" type="text" class="colored-field" />
        </div>

        <div class="form-group">
          <label>Brand:</label>
          <input v-model="product.brand" type="text" class="colored-field" />
        </div>

        <div class="form-group">
          <label>Delivery Charge:</label>
          <input v-model.number="product.deliveryCharge" type="number" class="colored-field" />
        </div>

        <div class="form-group">
          <label>Image:</label>
          <input type="file" @change="uploadImage" accept="image/*" class="colored-field" />
          <div v-if="uploading">Uploading...</div>
          <img v-if="product.imageURL" :src="product.imageURL" alt="Product" class="preview" />
        </div>

        <div class="button-group align-end">
          <button class="btn save-btn" type="submit">💾 Save Product</button>
          <button class="btn secondary-btn" @click.prevent="saveAndAddAnother">Save & Add Another</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import { db } from '@/firebase/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

export default {
  data() {
    return {
      product: {
        name: '',
        category: '',
        type: '',
        subcategory: '',
        quantity: 0,
        unit: 'Gram',
        pricePerKg: null,
        margin: 0,
        price: 0,
        discount: 0,
        description: '',
        tags: '',
        brand: '',
        deliveryCharge: 0,
        imageURL: '',
        sellerId: ''
      },
      categories: [],
      types: [],
      subcategories: [],
      sellers: [],
      uploading: false
    };
  },
  watch: {
    'product.category'(newCategoryId, oldCategoryId) {
      if (newCategoryId) {
        this.fetchTypesForCategory(newCategoryId);
        if (oldCategoryId) {
          this.product.type = '';
          this.product.subcategory = '';
          this.subcategories = [];
        }
      } else {
        this.types = [];
        this.subcategories = [];
        this.product.type = '';
        this.product.subcategory = '';
      }
    },
    'product.type'(newTypeName, oldTypeName) {
      const typeObj = this.types.find(t => t.name === newTypeName);
      if (typeObj) {
        this.fetchSubCategories(this.product.category, typeObj.id);
        if (oldTypeName) this.product.subcategory = '';
      } else {
        this.subcategories = [];
        this.product.subcategory = '';
      }
    }
  },
  methods: {
    capitalize(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    },
    async fetchCategories() {
      const snap = await getDocs(collection(db, 'categories'));
      this.categories = snap.docs.map(doc => ({
        id: doc.id,
        name: this.capitalize(doc.data().name)
      }));
    },

    async fetchTypesForCategory(categoryId) {
      this.types = [];
      const typesSnap = await getDocs(collection(db, `categories/${categoryId}/types`));
      this.types = typesSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    },

    async fetchSubCategories(categoryId, typeId) {
      this.subcategories = [];
      const subSnap = await getDocs(collection(db, `categories/${categoryId}/types/${typeId}/subcategories`));
      this.subcategories = subSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    },

    async fetchSellers() {
      const snapshot = await getDocs(collection(db, 'users'));
      this.sellers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ownerName: doc.data().store?.ownerName || 'Unnamed',
        storeName: doc.data().store?.storeName || 'No Store'
      }));
      if (this.sellers.length === 1) {
        this.product.sellerId = this.sellers[0].id;
      }
    },

    calculatePrice() {
      const grams = parseFloat(this.product.quantity);
      const perKg = parseFloat(this.product.pricePerKg);
      const margin = parseFloat(this.product.margin);
      if (!isNaN(perKg) && !isNaN(grams)) {
        const base = (perKg * grams) / 1000;
        this.product.price = Math.round(base + (base * margin / 100));
      }
    },

    async uploadImage(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.uploading = true;
      const folder = `${this.product.category || 'default'}/${this.product.type || 'general'}/${this.product.subcategory || 'misc'}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('folder', folder);

      const res = await fetch('https://api.cloudinary.com/v1_1/dc9rsnop8/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      this.product.imageURL = data.secure_url;
      this.uploading = false;
    },

async submitProduct() {
  const productId = this.product.name.trim();
  if (!productId) return alert("Product name is required");
  if (!this.product.sellerId) return alert("Please select a seller");

  const ref = doc(db, `users/${this.product.sellerId}/products/${productId}`);
  await setDoc(ref, {
    ...this.product,
    category: (this.categories.find(c => c.id === this.product.category)?.name) || this.capitalize(this.product.category),
    createdAt: serverTimestamp(),
    salesCount: 0,
    totalQuantity: null,
    id: productId,
    available: true,
    isHidden: false,
    tags: this.product.tags.split(',').map(t => t.trim()),
  });
  alert('Product saved successfully');
  this.$router.push({ name: 'ProductManager' });
}
,

async saveAndAddAnother() {
  const productId = this.product.name.trim();
  if (!productId) return alert("Product name is required");
  if (!this.product.sellerId) return alert("Please select a seller");

  const ref = doc(db, `users/${this.product.sellerId}/products/${productId}`);
  await setDoc(ref, {
    ...this.product,
    category: (this.categories.find(c => c.id === this.product.category)?.name) || this.capitalize(this.product.category),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    salesCount: 0,
    totalQuantity: 0,
    id: productId,
    available: true,
    isHidden: false,
    tags: this.product.tags.split(',').map(t => t.trim()),
  });

  alert('Product saved. Ready to add another.');

  this.product = {
    name: '',
    category: '',
    type: '',
    subcategory: '',
    quantity: 0,
    unit: 'Gram',
    pricePerKg: null,
    margin: 0,
    price: 0,
    discount: 0,
    description: '',
    tags: '',
    brand: '',
    deliveryCharge: 0,
    imageURL: '',
    sellerId: this.product.sellerId
  };
}
,

    goToBulkAdd() {
      this.$router.push({ name: 'BulkAdd' });
    }
  },

  mounted() {
    this.fetchCategories();
    this.fetchSellers();
  }
};
</script>


<style scoped>
/* .new-product-page.full-width {
  padding: 2rem;
  max-width: 100%;
  margin: auto;
  background: linear-gradient(to bottom right, #f0fdf4, #ffffff);
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
} */
.new-product-page.full-width {
  padding: 2rem;
  max-width: 100%;
  margin: auto;
  background-image: url('@/assets/bg.jpg');
  background-size: cover;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}

.back-btn {
  background-color: #dc0d0d;
  margin-right: auto;
}
.header {
  display: flex;
  align-items: center;
  /* padding: 1rem; */
  /* background: #4caf50; */
  background: #1a3654;
  color: white;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.logo {
  width: 45px;
  margin-right: 1rem;
}

.top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.bulk-btn {
  background: #ffa62b;
  color: white;
  padding: 0.6rem 1.2rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.form-container.wide {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 1200px;
  margin: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 1rem;
}

.form-group.half {
  flex: 0 0 48%;
}

.form-group.third {
  flex: 0 0 30%;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  margin-top: 0.4rem;
  background-color: #f9f9f9;
  transition: border-color 0.3s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #4caf50;
  outline: none;
}

.preview {
  width: 100px;
  margin-top: 0.5rem;
  border-radius: 8px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn,
.save-btn,
.secondary-btn {
  padding: 0.7rem 1.5rem;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: white;
}

.save-btn {
  background-color: #4caf50;
}

.secondary-btn {
  background-color: #4caf50;
}
</style>
