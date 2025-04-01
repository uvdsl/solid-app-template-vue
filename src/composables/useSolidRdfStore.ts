import { reactive } from "vue";
import { WebReactiveQuintStore } from "@uvdsl/solid-rdf-store";


const store = reactive(new WebReactiveQuintStore());
/**
*  Usage Example
* 
```ts
const { store } = useWebReactiveQuintStore();

let nameQueryResult: Ref<Quint[]> = await store.getQuintReactiveFromWeb(webId, VCARD("fn"), null, null, webId);
let photoQueryResult: Ref<Quint[]> = await store.getQuintReactiveFromWeb(webId, VCARD("hasPhoto"), null, null, webId);

const name = computed(() => nameQueryResult.value.map(e => e.object)[0]);
const vcardPhoto = computed(() => photoQueryResult.value.map(e => e.object)[0]);
```
*/
export const useSolidRdfStore = () => {
  return { store };
};

