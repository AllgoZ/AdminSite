<template>
  <div class="edit-product-page">
    <header class="header">
      <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
      <h1>Edit Product</h1>
    </header>

    <div class="form-container">
      <form @submit.prevent="saveProduct">
        <div class="row">
          <div class="form-group half">
            <label>Name:</label>
            <input v-model="product.name" type="text" required />
          </div>
          <div class="form-group half">
            <label>Seller ID:</label>
            <input v-model="product.sellerId" type="text" disabled />
          </div>
        </div>

        <div class="row">
          <div class="form-group half">
            <label>Category:</label>
            <select v-model="product.category">
              <option disabled value="">Select Category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group half">
            <label>Type:</label>
            <select v-model="product.type">
              <option disabled value="">Select Type</option>
              <option v-for="type in types" :key="type.id" :value="type.name">{{ type.name }}</option>
            </select>
          </div>
        </div>

        <div class="row" v-if="subcategories.length">
          <div class="form-group half">
            <label>Subcategory:</label>
            <select v-model="product.subcategory">
              <option disabled value="">Select Subcategory</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.name">{{ sub.name }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="form-group half">
            <label>Quantity:</label>
            <input v-model.number="product.quantity" type="number" required />
          </div>
          <div class="form-group half">
            <label>Unit:</label>
            <select v-model="product.unit">
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
            <label>Price:</label>
            <input v-model.number="product.price" type="number" required />
          </div>
          <div class="form-group third">
            <label>Price Per Kg:</label>
            <input v-model.number="product.pricePerKg" type="number" @input="calculatePrice" />
          </div>
          <div class="form-group third">
            <label>Margin (%):</label>
            <input v-model.number="product.margin" type="number" @input="calculatePrice" />
          </div>
        </div>

        <div class="form-group">
          <label>Discount (%):</label>
          <input v-model.number="product.discount" type="number" />
        </div>

        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="product.description"></textarea>
        </div>

        <div class="form-group">
          <label>Tags (comma separated):</label>
          <input v-model="product.tags" type="text" />
        </div>

        <div class="form-group">
          <label>Brand:</label>
          <input v-model="product.brand" type="text" />
        </div>

        <div class="form-group">
          <label>Delivery Charge:</label>
          <input v-model.number="product.deliveryCharge" type="number" />
        </div>

        <div class="form-group">
          <label>Image:</label>
          <input type="file" @change="uploadImage" accept="image/*" />
          <div v-if="uploading">Uploading...</div>
          <img v-if="product.imageURL" :src="product.imageURL" alt="Product" class="preview" />
        </div>

        <div class="button-group align-end">
          <button class="btn save-btn" type="submit">💾 Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase/firebase';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      product: { category: '', type: '', subcategory: '' },
      categories: [],
      types: [],
      subcategories: [],
      uploading: false,
      initializing: true,
    };
  },
  watch: {
    'product.category'(newCategoryId, oldCategoryId) {
      if (this.initializing) return;
      if (newCategoryId) {
        this.fetchTypesForCategory(newCategoryId).then(() => {
          const typeObj = this.types.find(t => t.name === this.product.type);
          if (typeObj) this.fetchSubCategories(newCategoryId, typeObj.id);
        });
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
      if (this.initializing) return;
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
    async fetchProduct() {
      const { id, sellerId } = this.$route.params;
      const docRef = doc(db, `users/${sellerId}/products/${id}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.product = { ...data, id, sellerId };
        if (Array.isArray(this.product.tags)) {
          this.product.tags = this.product.tags.join(', ');
        }
        const catEntry = this.categories.find(c => c.name.toLowerCase() === data.category?.toLowerCase());
        if (catEntry) {
          this.product.category = catEntry.id;
          await this.fetchTypesForCategory(catEntry.id);
          const typeEntry = this.types.find(t => t.name === data.type);
          if (typeEntry) {
            await this.fetchSubCategories(catEntry.id, typeEntry.id);
          }
        }
      }
      this.initializing = false;
    },
    async fetchCategories() {
      const snap = await getDocs(collection(db, 'categories'));
      this.categories = snap.docs.map(doc => ({ id: doc.id, name: this.capitalize(doc.data().name) }));
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
    async saveProduct() {
      const productRef = doc(db, `users/${this.product.sellerId}/products/${this.product.id}`);
      const categoryObj = this.categories.find(c => c.id === this.product.category);
      const categoryName = categoryObj ? categoryObj.name : this.capitalize(this.product.category);
      const tags = Array.isArray(this.product.tags)
        ? this.product.tags
        : (this.product.tags || '')
            .split(',')
            .map(t => t.trim())
            .filter(t => t);
      await updateDoc(productRef, {
        ...this.product,
        category: categoryName,
        tags,
      });
      alert('Product updated successfully!');
      this.$router.push({ name: 'ProductManager' });
    },
  },
  async mounted() {
    await this.fetchCategories();
    await this.fetchProduct();
  },
};
</script>

<style scoped>
.edit-product-page {
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(to bottom right, #f0fdf4, #ffffff);
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  background: #1a3654;
  color: white;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}
.logo {
  width: 45px;
  margin-right: 1rem;
}
.form-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 700px;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
input,
select,
textarea {
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  margin-top: 0.3rem;
}
.preview {
  width: 100px;
  margin-top: 0.5rem;
  border-radius: 8px;
}
.btn {
  padding: 0.6rem 1.2rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.half {
  flex: 1 1 45%;
}
.third {
  flex: 1 1 30%;
}
</style>
