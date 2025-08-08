<template>
  <div class="type-manager">
    <h2 class="section-title">📂 Manage Category Types</h2>

    <div v-if="categories.length === 0" class="loading-text">
      Loading categories...
    </div>

    <div
      v-for="category in categories"
      :key="category.id"
      class="category-block"
    >
      <div class="category-header">
        <img :src="category.image" alt="category image" class="category-image" />
        <h3>{{ category.name }}</h3>
      </div>

      <div class="type-form">
        <input
          v-model="newTypeNames[category.id]"
          placeholder="Type Name"
          class="input"
        />
        <input
          type="file"
          accept="image/*"
          @change="e => handleImageSelect(e, category.id)"
          class="input-file"
        />
        <button
          @click="addType(category.id)"
          class="btn-add"
          :disabled="loadingTypes[category.id]"
        >
          <span v-if="loadingTypes[category.id]">⏳ Adding...</span>
          <span v-else>➕ Add Type</span>
        </button>
      </div>

      <div v-if="category.types.length" class="types-grid">
          <div
            v-for="type in category.types"
            :key="type.id"
            class="type-card"
          >
            <img :src="type.image" class="type-image" />
            <p>{{ type.name }}</p>
            <div class="type-actions">
              <button class="edit-btn" @click="editType(category.id, type)">✏️</button>
              <button class="delete-btn" @click="deleteType(category.id, type.id)">🗑️</button>
              <button @click="toggleSubForm(category.id, type.id)">Add Subcategory</button>
            </div>

          <div v-if="showSubForm[category.id + '-' + type.id]" class="sub-form">
            <input v-model="subCategoryNames[category.id + '-' + type.id]" placeholder="Subcategory Name" class="input" />
            <input type="file" accept="image/*" @change="e => handleSubImageSelect(e, category.id, type.id)" class="input-file" />
            <button @click="addSubCategory(category.id, type.id)">Save Subcategory</button>
          </div>

          <!-- Display subcategories visually under each type -->
          <div v-if="type.subcategories && type.subcategories.length" class="sub-list">
            <h5>Subcategories:</h5>
            <ul>
                <li v-for="sub in type.subcategories" :key="sub.id">
                  <img :src="sub.image" class="sub-image" /> {{ sub.name }}
                  <button class="edit-btn" @click="editSubCategory(category.id, type.id, sub)">✏️</button>
                  <button class="delete-btn" @click="deleteSubCategory(category.id, type.id, sub.id)">🗑️</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

      <!-- Hierarchical View -->
      <div class="hierarchy">
        <h4>📘 Full Hierarchy:</h4>
        <ul>
          <li>
            <strong>{{ category.name }}</strong>
            <ul>
              <li v-for="type in category.types" :key="type.id">
                {{ type.name }}
                <ul>
                  <li v-for="sub in type.subcategories || []" :key="sub.id">
                    {{ sub.name }}
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>
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
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export default {
  data() {
    return {
      categories: [],
      newTypeNames: {},
      newTypeImages: {},
      loadingTypes: {},
      showSubForm: {},
      subCategoryNames: {},
      subCategoryImages: {},
    };
  },
  methods: {
async fetchCategories() {
  const catSnap = await getDocs(collection(db, 'categories'));
  const categoryList = [];

  for (const cat of catSnap.docs) {
    const catRef = doc(db, 'categories', cat.id);
    const typesSnap = await getDocs(collection(catRef, 'types'));

    const types = [];

    for (const typeDoc of typesSnap.docs) {
      const typeData = { id: typeDoc.id, ...typeDoc.data(), subcategories: [] };

      const subSnap = await getDocs(collection(typeDoc.ref, 'subcategories'));
      typeData.subcategories = subSnap.docs.map(sub => ({
        id: sub.id,
        ...sub.data()
      }));

      types.push(typeData);
    }

    categoryList.push({
      id: cat.id,
      name: cat.data().name,
      image: cat.data().image,
      types
    });
  }

  this.categories = categoryList;
},

    handleImageSelect(event, catId) {
      const file = event.target.files[0];
      if (file) this.newTypeImages[catId] = file;
    },
    handleSubImageSelect(event, catId, typeId) {
      const file = event.target.files[0];
      if (file) this.subCategoryImages[`${catId}-${typeId}`] = file;
    },
    async uploadToCloudinary(file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      const response = await fetch('https://api.cloudinary.com/v1_1/dc9rsnop8/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    },
    async addType(catId) {
      const name = this.newTypeNames[catId];
      const imageFile = this.newTypeImages[catId];
      if (!name || !imageFile) return;

      this.loadingTypes[catId] = true;

      try {
        const imageUrl = await this.uploadToCloudinary(imageFile);
        const typeId = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');

        const catRef = doc(db, 'categories', catId);
        const typeRef = doc(collection(catRef, 'types'), typeId);

        await setDoc(typeRef, { name, image: imageUrl });

        const newType = { id: typeId, name, image: imageUrl };
        const categoryIndex = this.categories.findIndex(cat => cat.id === catId);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex].types.push(newType);
        }

        this.newTypeNames[catId] = '';
        this.newTypeImages[catId] = null;
      } catch (error) {
        console.error("Error adding type:", error);
        alert("Error adding type. Please try again.");
      } finally {
        this.loadingTypes[catId] = false;
      }
    },
    toggleSubForm(catId, typeId) {
      const key = `${catId}-${typeId}`;
      this.showSubForm = { ...this.showSubForm, [key]: !this.showSubForm[key] };
    },
    async editType(catId, type) {
      const newName = prompt('Enter new type name', type.name);
      if (!newName) return;
      const catRef = doc(db, 'categories', catId);
      const typeRef = doc(collection(catRef, 'types'), type.id);
      await updateDoc(typeRef, { name: newName });
      const cat = this.categories.find(c => c.id === catId);
      const t = cat.types.find(t => t.id === type.id);
      if (t) t.name = newName;
    },
    async deleteType(catId, typeId) {
      if (!confirm('Delete this type?')) return;
      const catRef = doc(db, 'categories', catId);
      const typeRef = doc(collection(catRef, 'types'), typeId);
      await deleteDoc(typeRef);
      const cat = this.categories.find(c => c.id === catId);
      if (cat) cat.types = cat.types.filter(t => t.id !== typeId);
    },
    async addSubCategory(catId, typeId) {
      const key = `${catId}-${typeId}`;
      const name = this.subCategoryNames[key];
      const imageFile = this.subCategoryImages[key];
      if (!name || !imageFile) return;

      try {
        const imageUrl = await this.uploadToCloudinary(imageFile);
        const subTypeId = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');

        const catRef = doc(db, 'categories', catId);
        const typeRef = doc(collection(catRef, 'types'), typeId);
        const subRef = doc(collection(typeRef, 'subcategories'), subTypeId);
        await setDoc(subRef, { name, image: imageUrl });

        alert("Subcategory added successfully.");
        this.subCategoryNames[key] = '';
        this.subCategoryImages[key] = null;
        this.showSubForm[key] = false;
      } catch (error) {
        console.error("Error adding subcategory:", error);
        alert("Failed to add subcategory.");
      }
    },
    async editSubCategory(catId, typeId, sub) {
      const newName = prompt('Enter new subcategory name', sub.name);
      if (!newName) return;
      const catRef = doc(db, 'categories', catId);
      const typeRef = doc(collection(catRef, 'types'), typeId);
      const subRef = doc(collection(typeRef, 'subcategories'), sub.id);
      await updateDoc(subRef, { name: newName });
      const cat = this.categories.find(c => c.id === catId);
      const type = cat.types.find(t => t.id === typeId);
      const s = type.subcategories.find(sc => sc.id === sub.id);
      if (s) s.name = newName;
    },
    async deleteSubCategory(catId, typeId, subId) {
      if (!confirm('Delete this subcategory?')) return;
      const catRef = doc(db, 'categories', catId);
      const typeRef = doc(collection(catRef, 'types'), typeId);
      const subRef = doc(collection(typeRef, 'subcategories'), subId);
      await deleteDoc(subRef);
      const cat = this.categories.find(c => c.id === catId);
      const type = cat.types.find(t => t.id === typeId);
      if (type) type.subcategories = type.subcategories.filter(s => s.id !== subId);
    },
  },
  mounted() {
    this.fetchCategories();
  },
};
</script>


<style scoped>
.sub-form {
  margin-top: 0.75rem;
  background: #f4faff;
  border: 1px solid #cce4f6;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease-in-out;
}

.sub-form .input {
  padding: 0.5rem;
  font-size: 0.95rem;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.sub-form .input-file {
  border: none;
  background: #fff;
  font-size: 0.9rem;
}

.sub-form button {
  background: #4facfe;
  color: white;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.sub-form button:hover {
  background: #38f9d7;
}

.sub-list {
  margin-top: 0.5rem;
  background: #fefefe;
  border: 1px dashed #ddd;
  padding: 0.5rem;
  border-radius: 6px;
}

.sub-list h5 {
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
  color: #444;
}

.sub-list ul {
  padding-left: 1rem;
  margin: 0;
}

.sub-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.sub-image {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ccc;
}

.hierarchy {
  margin-top: 1.5rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
}

.hierarchy ul {
  padding-left: 1.2rem;
}

.hierarchy ul li {
  margin: 0.3rem 0;
  list-style-type: disc;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
} 

.type-manager {
  padding: 2rem;
  background: #f9fbfd;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a3654;
}
.loading-text {
  color: #666;
  font-style: italic;
  padding: 1rem;
}
.category-block {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}
.category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.category-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #00bcd4;
}
.type-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.input {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-width: 180px;
  font-size: 1rem;
}
.input-file {
  border: none;
  font-size: 0.95rem;
  background: #fff;
  cursor: pointer;
}
.btn-add {
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn-add:hover {
  background: linear-gradient(to right, #43e97b, #38f9d7);
}
.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}
.type-card {
  background: linear-gradient(135deg, #f3f9ff, #f0ffff);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.type-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  border: 2px solid #007aff30;
}
.type-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.edit-btn,
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
}
.delete-btn {
  color: #e53e3e;
}
</style>
