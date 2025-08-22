// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import ProductManager from './views/ProductManager.vue';
import EditProduct from './views/EditProduct.vue';
import NewProduct from './views/NewProduct.vue';
import LoginPage from './views/LoginPage.vue';
import OverviewAnalytics from './views/OverviewAnalytics.vue';
import SettingsPage from './views/SettingsPage.vue';
import CustomersPage from './views/CustomersPage.vue';
import EarningsExpenses from './views/EarningsExpenses.vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const routes = [
  { path: '/', redirect: '/admin' },

  {
    path: '/admin',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/product-management',
    name: 'ProductManager',
    component: ProductManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-product/:id/:sellerId',
    name: 'EditProduct',
    component: EditProduct,
    meta: { requiresAuth: true }
  },
  {
    path: '/new-product',
    name: 'NewProduct',
    component: NewProduct,
    meta: { requiresAuth: true }
  },
  {
    path: '/overview-analytics',
    name: 'OverviewAnalytics',
    component: OverviewAnalytics,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'CustomersPage',
    component: CustomersPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/earnings-expenses',
    name: 'EarningsExpenses',
    component: EarningsExpenses,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: SettingsPage,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

let authChecked = false;

// 🔐 Firebase Auth-based Route Guard
router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (!requiresAuth) {
    next(); // Allow public routes like /admin
  } else {
    if (authChecked) {
      const isLoggedIn = !!auth.currentUser;
      next(isLoggedIn ? undefined : '/admin');
    } else {
      onAuthStateChanged(auth, (user) => {
        authChecked = true;
        next(user ? undefined : '/admin');
      });
    }
  }
});

export default router;
