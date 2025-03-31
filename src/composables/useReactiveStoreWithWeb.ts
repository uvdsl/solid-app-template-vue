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
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets where retrieved from.
 */
class QuintStore {
  private datasets: { [key: string]: Store } = {};

  hasStore(key: string) {
    return _stripFragment(key) in this.datasets;
  }

  async setStore(key: string, store: Store) {
    this.datasets[_stripFragment(key)] = store;
  }

  async getQuint(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    if (dataset) {
      dataset = _stripFragment(dataset);
      if (!this.datasets[dataset]) {
        console.warn(`Dataset not found: ${dataset}`);
        return [];
      }
      return this.datasets[dataset].getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset!));
    }
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

interface IQuintStoreWebConfig { session: Session }

class QuintStoreWeb extends QuintStore {
  private config: IQuintStoreWebConfig = { session: new Session() };
  private loadingDatasets: Set<string> = new Set();

  setConfig(config: IQuintStoreWebConfig) {
    this.config = config;
  }

  async update(dataset: string) {
    if (this.loadingDatasets.has(dataset)) return; // Skip if already loading
    this.loadingDatasets.add(dataset);
    try {
      const data = (await getResource(dataset, this.config.session)).data;
      const { store } = await parseToN3(data, dataset);
      await this.setStore(dataset, store);
    } catch (error) {
      console.error("Failed to update dataset:", dataset, error);
    } finally {
      this.loadingDatasets.delete(dataset); // Ensure clean-up
    }
  }

  async getQuint(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    if (dataset && !this.hasStore(dataset)) {
      await this.update(dataset)
    }
    return this.getQuintLocal(subject, predicate, object, graph, dataset);
  }

  protected getQuintLocal(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    return super.getQuint(subject, predicate, object, graph, dataset);
  }

}


/**
 * A QuintQuery (s,p,o,g,d) where any element may be null (as a placeholder)
 */
class QuintQuery {
  readonly subject: string | null;
  readonly predicate: string | null;
  readonly object: string | null;
  readonly graph: string | null;
  readonly dataset: string | null;
  constructor(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    this.subject = subject
    this.predicate = predicate
    this.object = object
    this.graph = graph
    this.dataset = dataset
  }
  equals(q: QuintQuery): boolean {
    return this.subject == q.subject
      && this.predicate == q.predicate
      && this.object == q.object
      && this.graph == q.graph
      && this.dataset == q.dataset
  }
}


class ReactiveQuintQueryResult {
  query: QuintQuery;
  result: Quint[];
  constructor(query: QuintQuery, result: Quint[]) {
    this.query = query;
    this.result = result;
  }
  isResultOf(query: QuintQuery) {
    return this.query.equals(query)
  }
}

/**
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets where retrieved from.
 * This is the reactive version, where query results are updated, when the underlying data changes.
 */
class ReactiveQuintStoreWeb extends QuintStoreWeb {

  private reactiveResults: { [key: string]: ReactiveQuintQueryResult[] } = {};

  async setStore(key: string, store: Store) {
    key = _stripFragment(key);
    await super.setStore(key, store);
    if (!this.reactiveResults[key]) return;
    for (const result of this.reactiveResults[key]) {
      const newResult = await this.getQuintLocal(result.query.subject, result.query.predicate, result.query.object, result.query.graph, result.query.dataset);
      result.result.length = 0
      result.result.push(...newResult)
    }
  }

  async getQuintReactive(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    const query = new QuintQuery(subject, predicate, object, graph, dataset);
    const key = dataset ? _stripFragment(dataset) : "null";
    // if the dataset has not been queried before, make sure a query list exists
    if (!(key in this.reactiveResults)) {
      this.reactiveResults[key] = [];
    }
    // check if query is known
    const i = this.reactiveResults[key].findIndex(r => r.isResultOf(query));
    if (i >= 0) {
      // query result already exists
      return this.reactiveResults[key][i].result // if you want an update, manually call store.update(dataset:string)! 
    }
    try {
      // query result does not yet exists, query not yet known
      // if dataset not known, it will be fetched from the web
      const reactiveResult = await this.getQuint(subject, predicate, object, graph, dataset);
      const reactiveQueryResult = new ReactiveQuintQueryResult(query, reactiveResult);
      // remember query and result
      this.reactiveResults[key].push(reactiveQueryResult);
      return reactiveResult;
    } catch (error) {
      console.error("Reactive query failed:", error);
      return []; // Empty result on error
    }
  }

  clear() {
    super.clear();
    Object.values(this.reactiveResults).map(qr => qr.map(v => v.result)).flat().map(arr => arr.length = 0); // forget all query results, such that the UI also updates. forgetting queries does not suffice (UI wont update)!
  }
}

const store = reactive(new ReactiveQuintStoreWeb());

export const useReactiveStoreWithWeb = () => {
  return { store };
};