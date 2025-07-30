<template>
  <div class="pricing-settings">
    <h2 class="section-title">💸 Pricing Settings</h2>

    <form @submit.prevent="updateSettings" class="form-box">
      <label>Delivery Charge (in ₹)</label>
      <input v-model="deliveryCharge" type="number" required />

      <label>Discount (%)</label>
      <input v-model="discount" type="number" required />

      <label>Packaging Fee (in ₹)</label>
      <input v-model="packagingFee" type="number" required />

      <button type="submit" class="submit-button">Update Settings</button>
    </form>
  </div>
</template>

<script>
import { db } from '@/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      deliveryCharge: '',
      discount: '',
      packagingFee: ''
    };
  },
  async mounted() {
    const docSnap = await getDoc(doc(db, 'pricingSettings', 'values'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      this.deliveryCharge = data.deliveryCharge;
      this.discount = data.discount;
      this.packagingFee = data.packagingFee;
    }
  },
  methods: {
    async updateSettings() {
      await updateDoc(doc(db, 'pricingSettings', 'values'), {
        deliveryCharge: Number(this.deliveryCharge),
        discount: Number(this.discount),
        packagingFee: Number(this.packagingFee)
      });
      alert('Pricing settings updated!');
    }
  }
};
</script>

<style scoped>
.pricing-settings {
  background: linear-gradient(to right, #f0f8ff, #e6f2ff);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  margin: auto;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1a3654;
  text-align: center;
}
.form-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
input {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}
.submit-button {
  padding: 0.7rem;
  background: linear-gradient(to right, #007aff, #00c6ff);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.submit-button:hover {
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
}
</style>
