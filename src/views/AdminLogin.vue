<template>
  <div class="login-container">
    <div class="login-box">
      <img src="@/assets/logo.png" alt="AllGoZ Logo" class="logo" />
      <h2>Admin Login</h2>
      <form @submit.prevent="handleLogin">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import { auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default {
  name: "AdminLogin",
  data() {
    return {
      email: "",
      password: "",
      error: null,
    };
  },
  methods: {
    async handleLogin() {
      this.error = null;
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password);
        // TODO: Navigate to dashboard (we’ll set this up later)
        alert("Login successful");
      } catch (err) {
        this.error = err.message;
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f8fa;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.logo {
  width: 100px;
  margin-bottom: 1rem;
}

form input {
  width: 100%;
  padding: 12px;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 16px;
}

form button {
  width: 100%;
  padding: 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.3s ease;
}

form button:hover {
  background-color: #005fcc;
}

.error {
  color: red;
  margin-top: 0.5rem;
}
</style>
