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


import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';

const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
    }
});
app.component('Button', Button);
app.component('InputText', InputText);
app.component('Divider', Divider);


app.component('Toast', Toast);
app.use(ToastService);

app.mount('#app')