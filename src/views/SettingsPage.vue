<template>
  <div class="settings-wrapper">
    <AppSidebar :active="'settings'" @toggle="toggleSidebar" :open="sidebarOpen" />
    <div class="settings-content" :class="{ 'shifted': sidebarOpen }">
      <AppHeader title="Settings" @toggle="toggleSidebar" />

      <!-- Banners -->
      <BannerManager />

      <!-- Pricing Settings -->
      <PricingSettings />

      <!-- Add Category -->
      <CategoryManager />

      <!-- Manage Types for Categories -->
      <TypeManager />

      <!-- Sales Count Table -->
      <SalesCounter />

      <AppFooter />
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/AppSidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import BannerManager from '@/views/settings/BannerManager.vue';
import PricingSettings from '@/views/settings/PricingSettings.vue';
import CategoryManager from '@/views/settings/CategoryManager.vue';
import TypeManager from '@/views/settings/TypeManager.vue';
// import SalesCounter from '@/views/settings/SalesCounter.vue';

export default {
  name: 'SettingsPage',
  components: {
    AppSidebar,
    AppHeader,
    AppFooter,
    BannerManager,
    PricingSettings,
    CategoryManager,
    TypeManager,
    // SalesCounter
  },
  data() {
    return {
      sidebarOpen: false
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }
};
</script>

<style scoped>
.settings-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #c4f8ff;
}
.settings-content {
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  margin-left: 0;
  padding: 1rem;
}
.settings-content.shifted {
  margin-left: 250px;
}
</style>
