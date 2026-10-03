<template>
  <footer class="footer">
    <p>&copy; {{ new Date().getFullYear() }} PodWave. Todos os direitos reservados.</p>
  </footer>
</template>

<style scoped>
.footer {
  padding: 1rem 1.5rem;
  text-align: center;
  border-top: 1px solid var(--pw-border);
  background-color: var(--pw-surface);
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
