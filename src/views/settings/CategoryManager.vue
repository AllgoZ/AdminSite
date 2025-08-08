<template>
  <div class="category-manager">
    <h3>➕ Add New Category</h3>
    <div class="form">
      <input v-model="newCategoryName" type="text" placeholder="Category Name" />
      <input type="file" accept="image/*" @change="handleImageUpload" />
      <img v-if="previewImage" :src="previewImage" class="preview" />
      <button @click="addCategory" class="primary-button">Add Category</button>
    </div>

    <div class="category-list">
      <h4>📦 Existing Categories</h4>
      <div v-if="categories.length === 0">No categories found.</div>
      <ul>
        <li v-for="cat in categories" :key="cat.id">
          <img :src="cat.image" />
          <span>{{ cat.name }}</span>
          <button class="edit-btn" @click="editCategory(cat)">✏️</button>
          <button class="image-btn" @click="startImageEdit(cat)">🖼️</button>
          <button v-if="cat.image" class="remove-image-btn" @click="removeImage(cat.id)">🚫</button>
          <button class="delete-btn" @click="deleteCategory(cat.id)">🗑️</button>
        </li>
      </ul>
    </div>
    <input
      type="file"
      accept="image/*"
      ref="editImageInput"
      style="display: none"
      @change="handleImageUpdate"
    />
  </div>
</template>

<script>
import { db } from '@/firebase/firebase';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      newCategoryName: '',
      selectedImage: null,
      previewImage: null,
      categories: [],
      cloudName: 'dc9rsnop8',
      uploadPreset: 'ml_default',
      editingCategoryId: null
    };
  },
  methods: {
    async fetchCategories() {
      const snap = await getDocs(collection(db, 'categories'));
      this.categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    handleImageUpload(event) {
      const file = event.target.files[0];
      this.selectedImage = file;
      this.previewImage = URL.createObjectURL(file);
    },
    async uploadToCloudinary(file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.secure_url;
    },
    async addCategory() {
      if (!this.newCategoryName || !this.selectedImage) return alert('Fill in all fields');

      const imageUrl = await this.uploadToCloudinary(this.selectedImage);
      const id = this.newCategoryName.trim().toLowerCase().replaceAll(' ', '_');

      await setDoc(doc(db, 'categories', id), {
        name: this.newCategoryName,
        image: imageUrl
      });

      this.newCategoryName = '';
      this.selectedImage = null;
      this.previewImage = null;
      this.fetchCategories();
    },
    async editCategory(cat) {
      const newName = prompt('Enter new category name', cat.name);
      if (!newName) return;
      await updateDoc(doc(db, 'categories', cat.id), { name: newName });
      this.fetchCategories();
    },
    startImageEdit(cat) {
      this.editingCategoryId = cat.id;
      this.$refs.editImageInput.click();
    },
    async handleImageUpdate(event) {
      const file = event.target.files[0];
      if (!file || !this.editingCategoryId) return;
      const imageUrl = await this.uploadToCloudinary(file);
      await updateDoc(doc(db, 'categories', this.editingCategoryId), { image: imageUrl });
      this.fetchCategories();
      this.editingCategoryId = null;
      event.target.value = '';
    },
    async removeImage(id) {
      if (!confirm('Remove image from this category?')) return;
      await updateDoc(doc(db, 'categories', id), { image: '' });
      this.fetchCategories();
    },
    async deleteCategory(id) {
      if (!confirm('Delete this category?')) return;
      await deleteDoc(doc(db, 'categories', id));
      this.fetchCategories();
    }
  },
  mounted() {
    this.fetchCategories();
  }
};
</script>

<style scoped>
.category-manager {
  padding: 1rem;
}
.category-manager h3 {
  margin-bottom: 0.5rem;
  color: #1a3654;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.primary-button {
  background: linear-gradient(90deg, #007aff, #00c6ff);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.category-list ul {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}
.category-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}
.category-list li img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ccc;
}
.edit-btn,
.delete-btn,
.image-btn,
.remove-image-btn {
  background: none;
  border: none;
  cursor: pointer;
}
.delete-btn {
  color: #e53e3e;
}
</style>
