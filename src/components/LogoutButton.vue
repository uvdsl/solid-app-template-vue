<script setup lang="ts">
import { useSolidSession } from '../composables/useSolidSession';
import { useSolidRdfStore } from '../composables/useSolidRdfStore';

const { session } = useSolidSession();
const { store } = useSolidRdfStore();

async function logout() {
  session.logout();
  store.clear();
}
</script>

<template>
    <Button v-if="session.isActive" id="button-sign-out" class="p-button-secondary p-button-rounded"
      icon="pi pi-sign-out" @click="logout" />
</template>

<style scoped>
</style>
