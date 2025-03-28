<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import LandingView from './views/LandingView.vue'
import StoragePane from './views/StoragePane.vue'
import { useSolidSession } from './composables/useSolidSession';

const { session, restoreSession } = useSolidSession();
restoreSession().then(() => console.log("Logged in:",session.isActive, session.webId));
</script>

<template>
  <div id="content-header">
    <!-- <img id="logo" src="/public/img/icons/apple-touch-icon-76x76.png" alt="Icon" /> -->
    <span>
      <HelloWorld />
    </span>
    <span style="color:black; font-weight: bold;">Solid Cloud</span>
    <span>
      <HelloWorld v-if="session.isActive" />
    </span>
  </div>
  <div id="content-background-pane">
    <LandingView />
    <!-- <StoragePane /> -->
  </div>
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
</style>
