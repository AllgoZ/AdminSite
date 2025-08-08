<template>
  <div class="settings-card">
    <h2 class="section-title">📢 Manage Banners</h2>

    <div class="banner-upload">
      <input type="file" ref="fileInput" accept="image/*" @change="handleImageUpload" hidden />
      <button class="upload-btn" @click="$refs.fileInput.click()">
        <i class="ri-upload-2-line"></i> Add New Banner
      </button>
    </div>

    <div v-if="loading" class="loading">Uploading...</div>

    <div class="banner-list">
      <div v-for="banner in banners" :key="banner.id" class="banner-item">
        <img :src="banner.image_url" class="banner-img" />
        <div class="banner-actions">
          <button class="icon-btn" @click="editBanner(banner.id)">✏️</button>
          <button class="icon-btn danger" @click="deleteBanner(banner.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default {
  data() {
    return {
      banners: [],
      loading: false
    };
  },
  methods: {
    async fetchBanners() {
      const snap = await getDocs(collection(db, 'banners'));
      this.banners = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.loading = true;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const cloudName = 'dc9rsnop8';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      const imageUrl = data.secure_url;
      await addDoc(collection(db, 'banners'), { image_url: imageUrl });
      this.fetchBanners();
      this.loading = false;
    },
    async deleteBanner(id) {
      await deleteDoc(doc(db, 'banners', id));
      this.fetchBanners();
    },
    async editBanner(id) {
    this.editingBannerId = id;
    this.$refs.fileInput.click();

    this.$refs.fileInput.onchange = async (e) => {
        const picked = e.target.files[0];
        if (!picked) return;
        this.loading = true;

        const formData = new FormData();
        formData.append('file', picked);
        formData.append('upload_preset', 'ml_default');

        const res = await fetch(`https://api.cloudinary.com/v1_1/dc9rsnop8/image/upload`, {
        method: 'POST',
        body: formData
        });

        const data = await res.json();
        const newUrl = data.secure_url;

        await updateDoc(doc(db, 'banners', id), { image_url: newUrl });
        this.fetchBanners();
        this.loading = false;
    };
    }

  },
  mounted() {
    this.fetchBanners();
  }
};
</script>

<style scoped>
.settings-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}
.section-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #1a3654;
  margin-bottom: 1rem;
}
.banner-upload {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.upload-btn {
  background: linear-gradient(to right, #007aff, #00c6ff);
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.upload-btn:hover {
  box-shadow: 0 6px 14px rgba(0, 122, 255, 0.3);
}
.loading {
  margin-top: 1rem;
  font-style: italic;
  color: #555;
}
.banner-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}
.banner-item {
  background: #f9f9f9;
  padding: 0.8rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
}
.banner-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
.banner-actions {
  display: flex;
  gap: 0.5rem;
}
.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}
.icon-btn:hover {
  color: #007aff;
}
.icon-btn.danger:hover {
  color: #ff5252;
}
</style>
