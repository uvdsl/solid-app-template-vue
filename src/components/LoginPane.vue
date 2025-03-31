<script setup lang="ts">
import { ref } from 'vue';
import { useSolidSession } from '../composables/useSolidSession';
import { useToast } from 'primevue/usetoast';
import { getResource, parseToN3 } from '@uvdsl/solid-requests';
import { SOLID } from '@uvdsl/solid-requests';

const { session } = useSolidSession();
const toast = useToast();
const redirect_uri = window.location.href;
const webid = ref("");
const idps = [
  'https://solid.aifb.kit.edu',
  'https://solidcommunity.net',
  'https://solidweb.org',
  'https://solidweb.me',
];

async function loginWithWebID(webid: string) {
  let resp;
  try {
    resp = await getResource(webid);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Could not retrieve WebID profile!",
      detail: err,
      life: 5000,
    });
    return;
  }
  let profileStore;
  try {
    const parsed = await parseToN3(resp.data, webid);
    profileStore = parsed.store;
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Could not parse WebID profile!",
      detail: err,
      life: 5000,
    });
    return;
  }
  let idp;
  try {
    idp = profileStore.getObjects(webid, SOLID("oidcIssuer"), null)[0].value;
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "No OIDC issuer found!",
      detail: err,
      life: 5000,
    });
    return;
  }
  idp = idp.endsWith("/") ? idp.substring(0, idp.length - 1) : idp;
  try {
    await session.login(idp, redirect_uri);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error on initiating login!",
      detail: err,
      life: 5000,
    });
  }
}
async function logIntoIDP(idp: string) {
  try {
    await session.login(idp, redirect_uri);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error on initiating login!",
      detail: err,
      life: 5000,
    });
  }
}
function getAPod() {
  window.open("https://solidproject.org/users/get-a-pod", "_blank")?.focus();
};
function toSolid() {
  window.open("https://solidproject.org/", "_blank")?.focus();
};
</script>

<template>
  <div id="webid-login-card">
    <h3>Login with your WebID</h3>
    <div class="idp-button">
      <Button @click="loginWithWebID(webid)" icon="pi pi-sign-in" />
      <InputText placeholder="Enter your WebID" type="text" v-model="webid" class="idp-button"
        @keyup.enter="loginWithWebID(webid)" />
    </div>
  </div>

  <Divider />

  <!-- Predefined IDPs -->
  <div id="idp-login-card">
    <h3>or take a shortcut</h3>
  </div>
  <div v-for="(url, index) in idps" :key="url" :id="'idp-' + index" class="idp-button-wrapper">
    <Button :label="url" icon="pi pi-sign-in" class=" idp-button" @click="logIntoIDP(url)" />
  </div>

  <Divider />

  <!-- new to Solid? -->
  <div id="new-register-card">
    <h3>New to Solid?</h3>
    <div class="lg:flex sm:idp-button-wrapper">
      <Button label="What is Solid" icon="pi pi-question" iconPos="right" class="p-button-secondary idp-button" @click="toSolid" />
      <Button label="Get a Pod!" icon="pi pi-user-plus" iconPos="right" class="p-button-secondary idp-button" @click="getAPod" />
    </div>
  </div>

</template>

<style scoped>
.idp-button-wrapper {
  padding: 5px 0 5px 0;
  display: flex;
}

.idp-button {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  /* Align text to the left */
}
</style>
