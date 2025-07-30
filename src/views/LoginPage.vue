<template>
  <div class="login-page">
    <div class="login-box">
      <img src="@/assets/logo.png" alt="AllGoZ Logo" class="logo" />
      <h2>Admin Login</h2>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="login">🔐 Login</button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default {
  data() {
    return {
      email: '',
      password: '',
      error: '',
    };
  },
  methods: {
    async login() {
      this.error = '';
      const auth = getAuth();
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password);
        this.$router.push({ name: 'ProductManager' });
      } catch (err) {
        this.error = 'Invalid email or password';
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom right, #d4fc79, #96e6a1);
  font-family: 'Segoe UI', sans-serif;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 90%;
  max-width: 350px;
}

.logo {
  width: 60px;
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border-radius: 12px;
  border: 1px solid #ccc;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #4caf50;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  margin-top: 1rem;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}

.error {
  color: red;
  margin-top: 0.5rem;
}
</style>
