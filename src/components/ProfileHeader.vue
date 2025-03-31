<script setup lang="ts">
import { useSolidSession } from '../composables/useSolidSession';
import { computed, ref, watch } from 'vue';
import { VCARD } from '../libs/namespaces';
import { useReactiveStoreWithWeb, Quint } from '../composables/useReactiveStoreWithWeb';

const { session } = useSolidSession();
const { store } = useReactiveStoreWithWeb();


let nameQueryResult = ref<Quint[]>([])
let photoQueryResult = ref<Quint[]>([])

watch(() => (session.webId), async (webId, _) => {
  // only watching the webId to not query the store with webId being undefined
  if (!webId) {
    return;
  }
  nameQueryResult.value = await store.getQuintReactive(webId, VCARD("fn"), null, null, webId);
  photoQueryResult.value = await store.getQuintReactive(webId, VCARD("hasPhoto"), null, null, webId);
}, { immediate: true });

const name = computed(() => nameQueryResult.value.map(e => e.object)[0]);
const vcardPhoto = computed(() => photoQueryResult.value.map(e => e.object)[0]);

async function logout() {
  session.logout();
  store.clear();
}
</script>

<template>
  <div class="lg:col-2 col-6">
    <img id="logo" src="/src/assets/logo.png" alt="Icon" />
  </div>
  <div class="hidden lg:block lg:col-5 text-center" style="color:black; font-weight: bold;">
    <div>Welcome to Your Data Space</div>
    <span>{{ name || session.webId }}</span>
  </div>
  <div id="right-header" class="lg:col-2 col-6 flex justify-content-end align-items-center">
    <img v-if="vcardPhoto" id="profile-photo" class="overlap" :src="vcardPhoto" />
    <Button v-if="session.isActive" id="button-sign-out" class="p-button-secondary p-button-rounded"
      icon="pi pi-sign-out" @click="logout" />
  </div>
</template>

<style scoped>
.overlap {
  border-radius: 50%;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  margin-right: -10%;
}



/* Default overlap on large screens */
@media (min-width: 1024px) {
  .overlap {
    margin-right: -10%;
  }

  #right-header:hover .overlap {
    margin-right: 2px;
  }
}

/* No overlap on small screens */
@media (max-width: 1023px) {
  .overlap {
    margin-right: 8px; /* Space instead of overlap */
  }
}
</style>
