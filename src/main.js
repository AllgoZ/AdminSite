// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { auth } from './firebase/firebase'; // ✅ Make sure this imports correctly

let app;

import { onAuthStateChanged } from 'firebase/auth';

// 🔐 Delay app mounting until auth state is resolved
onAuthStateChanged(auth, () => {
  if (!app) {
    app = createApp(App);
    app.use(router);
    app.mount('#app');
  }
});
