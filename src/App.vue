<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container site-header-inner">
      <router-link class="brand" :to="{ name: 'screeningForm' }">
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M3 17h7l3-8 5 15 3-7h8" />
        </svg>
        Migraine study
      </router-link>
      <nav aria-label="Main">
        <router-link :to="{ name: 'screeningForm' }"
          >Screening form</router-link
        >
        <router-link :to="{ name: 'results' }">Results</router-link>
      </nav>
    </div>
  </header>
  <main id="main" ref="main" tabindex="-1">
    <router-view />
  </main>
  <footer class="site-footer">
    <div class="container">
      A small Vue starter for a screening workflow. It is not a clinical
      decision system.
    </div>
  </footer>
</template>

<script>
export default {
  name: "App",
  watch: {
    // Move focus to the new page so screen readers announce the change.
    "$route.name"(name, previous) {
      if (previous) this.$nextTick(() => this.$refs.main?.focus());
    },
  },
};
</script>
