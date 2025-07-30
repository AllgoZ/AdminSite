<template>
  <header class="header">
    <button class="hamburger" @click="$emit('toggle')">☰</button>
    <img src="@/assets/logo.png" alt="AllGoZ" class="logo" />
    <h1>{{ title }}</h1>
  </header>
</template>

<script>
export default {
  props: ['title']
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  background-color: #1a3654;
  color: white;
  /* padding: 1rem; */
  border-radius: 10px;
  margin-bottom: 1.5rem;
}
.logo {
  width: 45px;
  margin-right: 1rem;
}
.hamburger {
  background: transparent;
  border: none;
  font-size: 24px;
  color: white;
  margin-right: 1rem;
  cursor: pointer;
}
</style>
