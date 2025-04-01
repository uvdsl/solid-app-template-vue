import { createApp } from 'vue'
import App from './App.vue'

import "./registerServiceWorker";

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import Button from "primevue/button";
import InputText from 'primevue/inputtext';
import Divider from 'primevue/divider';
import Dialog from 'primevue/dialog';


import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import { definePreset } from '@primevue/themes';

const app = createApp(App);

const SolidAura = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{violet.50}',
            100: '{violet.100}',
            200: '{violet.200}',
            300: '{violet.300}',
            400: '{violet.400}',
            500: '{violet.500}',
            600: '{violet.600}',
            700: '{violet.700}',
            800: '{violet.800}',
            900: '{violet.900}',
            950: '{violet.950}'
        },
        surface: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        }
    }
});

app.use(PrimeVue, {
    theme: {
        preset: SolidAura,
    }
});
app.component('Button', Button);
app.component('InputText', InputText);
app.component('Divider', Divider);
app.component('Dialog', Dialog);


app.component('Toast', Toast);
app.use(ToastService);

app.mount('#app')