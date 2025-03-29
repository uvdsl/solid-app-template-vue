<script setup lang="ts">
import { useSolidSession } from '../composables/useSolidSession';
import { ref, Ref, watch } from 'vue';
import { VCARD } from '../libs/namespaces';
import { useDatasetStore } from '../composables/useDatasetStore';
import { getResource, parseToN3 } from '../libs/solidRequests';

const { session } = useSolidSession();
const { datasetStore } = useDatasetStore();

let name: Ref<string | undefined> = ref();
let vcardPhoto: Ref<string | undefined> = ref();

watch(() => session.webId, async (webId, _) => {
  if (!webId) {
    return;
  }
  if (!datasetStore.hasStore(webId)) {
    let profileStore = await getResource(webId, session)
      .then((resp) => resp.data)
      .then((respText) => parseToN3(respText, webId))
      .then(parsedN3 => parsedN3.store);
    datasetStore.addStore(webId, profileStore);
  }
  let query = datasetStore.getQuint(webId, VCARD("fn"), null, null, webId);
  name.value = query.length > 0 ? query[0].object : undefined;
  query = datasetStore.getQuint(webId, VCARD("hasPhoto"), null, null, webId);
  vcardPhoto.value = query.length > 0 ? query[0].object : undefined;
})
</script>

<template>
  <div class="col-3">
    <img id="logo" src="/src/assets/logo.png" alt="Icon" />
  </div>
  <div class="hidden lg:block lg:col-3 text-center">
    <span style="color:black; font-weight: bold;">Your Data Space {{ name ? "(" + name + ")" : "" }}</span>
  </div>
  <div class="col-3 flex justify-content-end">
    <img v-if="session.isActive" id="profile-photo" :src="vcardPhoto" />
  </div>
</template>

<style scoped></style>
