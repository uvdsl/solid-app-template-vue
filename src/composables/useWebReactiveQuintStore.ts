import { reactive } from "vue";
import { Store } from "n3";
import { Session } from "@uvdsl/solid-oidc-client-browser";
import { getResource, parseToN3 } from "../libs/solidRequests";

/**
 *
 * @param uri: the URI to strip from its fragment #
 * @return substring of the uri prior to fragment #
 */
function _stripFragment(uri: string): string {
  const indexOfFragment = uri.indexOf("#");
  if (indexOfFragment !== -1) {
    uri = uri.substring(0, indexOfFragment);
  }
  return uri;
}

interface IQuintStoreWebConfig { session: Session }

/**
 * A Quint (s,p,o,g,d) is an RDF Quad, extended by the URI where the dataset was retrieved from.
 */
export class Quint {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
  readonly graph: string;
  readonly dataset: string;
  constructor(subject: string, predicate: string, object: string, graph: string, dataset: string) {
    this.subject = subject
    this.predicate = predicate
    this.object = object
    this.graph = graph
    this.dataset = dataset
  }
}

/**
 * A QuintQuery (s,p,o,g,d) where any element may be null (as a placeholder).
 * It has an (empty) result list of Quints.
 */
class QuintQuery {

  readonly subject: string | null;
  readonly predicate: string | null;
  readonly object: string | null;
  readonly graph: string | null;
  readonly dataset: string | null;

  readonly result: Quint[];

  constructor(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null, result: Quint[]) {
    this.subject = subject
    this.predicate = predicate
    this.object = object
    this.graph = graph
    this.dataset = dataset
    this.result = result
  }

  equals(q: QuintQuery): boolean {
    return this.subject == q.subject
      && this.predicate == q.predicate
      && this.object == q.object
      && this.graph == q.graph
      && this.dataset == q.dataset
  }

}


/**
 * A QuintStore is a set of Quints (s,p,o,g,d). It thus keeps track of where datasets (i.e. Quads) were retrieved from.
 */
class QuintStore {
  private datasets: { [dataset: string]: Store } = {};

  has(dataset: string) {
    return _stripFragment(dataset) in this.datasets;
  }

  update(dataset: string, store: Store) {
    this.datasets[_stripFragment(dataset)] = store;
  }

  getQuint(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    if (dataset) { // if a specific dataset was queried
      dataset = _stripFragment(dataset);
      if (!this.datasets[dataset]) { // if the store does contain the dataset?
        console.warn(`Dataset not found: ${dataset}`);
        return [];
      }
      // if the store contains the dataset, execute the query
      return this.datasets[dataset].getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset!));
    }
    // if dataset is unspecified, query all datasets
    const results = [];
    for (const [dataset, store] of Object.entries(this.datasets)) {
      results.push(store.getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset)));
    }
    return results.flat();
  }

  clear() {
    this.datasets = {};
  }
}


/**
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets (i.e. Quads) were retrieved from.
 * This is the reactive version, where query results (obtained via {@link getQuintReactive}) are updated when the underlying data changes.
 */
class ReactiveQuintStore extends QuintStore {

  private queries: { [dataset: string]: QuintQuery[] } = {};

  getQuintReactive(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    const query = new QuintQuery(subject, predicate, object, graph, dataset, []);
    dataset = dataset ? _stripFragment(dataset) : "null";
    // if the dataset has not been queried before, make sure a query list exists
    if (!this.queries[dataset]) {
      this.queries[dataset] = [];
    }
    // check if query is known
    const i = this.queries[dataset].findIndex(q => q.equals(query));
    if (i >= 0) { // query result already exists
      return this.queries[dataset][i].result // if you want an update, manually call store.update(dataset:string, store:Store)! 
    }
    // query result does not yet exists, query not yet known
    query.result.push(...this.getQuint(subject, predicate, object, graph, dataset));
    // remember query and result
    this.queries[dataset].push(query);
    // return reactive query result
    return query.result;
  }

  update(dataset: string, store: Store) {
    dataset = _stripFragment(dataset);
    // put new store 
    super.update(dataset, store);
    // if the dataset has not been queried before, make sure a query list exists
    if (!this.queries[dataset]) {
      this.queries[dataset] = [];
    }
    // re-run all queries to update reactivly
    for (const query of this.queries[dataset]) {
      // run query
      const newResult = this.getQuint(query.subject, query.predicate, query.object, query.graph, query.dataset);
      // update result
      query.result.length = 0
      query.result.push(...newResult)
    }
    return this;
  }

  clear() {
    super.clear();
    Object.values(this.queries).map(qr => qr.map(v => v.result)).flat().map(arr => arr.length = 0); // forget all query results, such that the UI also updates. forgetting queries does not suffice (UI wont update)!
    return this;
  }
}


/**
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets where retrieved from.
 * This is the web version (manual edition), call {@link getQuintReactiveFromWeb} to fetch a dataset from the web if it is not already loaded into the store.
 * Datasets are lazy loaded, and not updated automatically: Call {@link updateFromWeb} to trigger a re-load of a dataset.
 * Then, whenever the data in the store is updated, all reactive query results (obtainer via {@link getQuintReactiveFromWeb} or {@link getQuintReactive}) are updated as well.
 * 
 */
class WebReactiveQuintStore extends ReactiveQuintStore {
  private config: IQuintStoreWebConfig = { session: new Session() };
  private datasetsLoading: Set<string> = new Set();

  setConfig(config: IQuintStoreWebConfig) {
    this.config = config;
    return this;
  }

  async getQuintReactiveFromWeb(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    if (dataset && !this.has(dataset)) {
      await this.updateFromWeb(dataset)
    }
    return this.getQuintReactive(subject, predicate, object, graph, dataset);
  }

  async updateFromWeb(dataset: string) {
    if (this.datasetsLoading.has(dataset)) { // Skip if already fetching from web
      return this;
    }
    this.datasetsLoading.add(dataset);
    try {
      const data = (await getResource(dataset, this.config.session)).data;
      const { store } = await parseToN3(data, dataset);
      this.update(dataset, store);
    } catch (error) {
      console.error("Failed to update dataset:", dataset, error);
    } finally {
      this.datasetsLoading.delete(dataset); // Ensure clean-up
    }
    return this;
  }

}

const store = reactive(new WebReactiveQuintStore());

export const useWebReactiveQuintStore = () => {
  return { store };
};