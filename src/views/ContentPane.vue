<script setup lang="ts">
import { ref } from 'vue'


const count = ref(0)
</script>

<template>
  <div class="card">
    <Button @click="count++">count is {{ count }}</Button>
  </div>
</template>

<style scoped></style>
