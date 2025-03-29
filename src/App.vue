<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import LandingView from './views/LandingView.vue'
import StoragePane from './views/StoragePane.vue'
import { useSolidSession } from './composables/useSolidSession';
import { useServiceWorkerUpdate } from './composables/useServiceWorkerUpdate';

const { hasUpdatedAvailable, refreshApp } = useServiceWorkerUpdate();
const { session, restoreSession } = useSolidSession();
restoreSession().then(() => console.log("Logged in:", session.isActive, "WebID:", session.webId));
</script>

<template>
  <div id="content-header">
    <div class="col-3">
      <img id="logo" src="/src/assets/logo.png" alt="Icon" /> 
    </div>
    <div class="hidden lg:block lg:col-3 text-center">
      <span style="color:black; font-weight: bold;">Your Data Space</span>
    </div>
    <div class="col-3 flex justify-content-end">
      <span>
        <HelloWorld v-if="session.isActive" />
      </span>
    </div>
  </div>
  <div id="content-background-pane">
    <LandingView />
    <!-- <StoragePane /> -->
  </div>
  <Dialog id="update-dialog" header="We updated the App!" v-model:visible="hasUpdatedAvailable" position="bottomright"
    :breakpoints="{ '420px': '100vw' }">
    <div>Save your progress.</div>
    <div>Get the latest version.</div>
    <template #footer>
      <Button label="Update" autofocus @click="refreshApp" />
    </template>
  </Dialog>
  <Toast position="bottom-right" :breakpoints="{ '420px': { width: '100%', right: '0', left: '0' } }" />
</template>

<style>
html {
  width: 100vw;
  height: 100vh;
  overscroll-behavior-y: contain;
}

body {
  overscroll-behavior-y: contain;
  padding: 0px;
  margin: 0px;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  font-weight: 400;
}

#app {
  height: 100%;
  width: 100%;
  padding: 10px;
  background-color: var(--p-emerald-200);
}

.no-tap-highlight {
  -webkit-tap-highlight-color: transparent;
}

.p-button {
  -webkit-tap-highlight-color: transparent;
}

#content-header {
  height: 55px;
  padding: 0 15px 5px 15px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

#content-background-pane {
  width: 100%;
  height: calc(100% - 55px);
  background-color: var(--p-zinc-800);
  box-sizing: border-box;
  border-radius: 30px;
  padding: 30px;
}

#logo {
  height: 50px;
  width: 50px;
  object-fit: contain;
}

#update-dialog {
  border-radius: 30px;
}
</style>
