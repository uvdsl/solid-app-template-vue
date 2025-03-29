import { reactive } from "vue";
import { OTerm, Store } from "n3";

/**
 * A Quint (s,p,o,g,d) is an RDF Quad, extended by the URI where the dataset was retrieved from.
 */
class Quint {
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
 * A DatasetStore is a set of quints. It thus keeps track of where datasets where retrieved from.
 */
class DatasetStore {
  private datasets: { [key: string]: Store } = {};

  addStore(key: string, store: Store) {
    this.datasets[this._stripFragment(key)] = store;
  }

  hasStore(key: string) {
    return this._stripFragment(key) in this.datasets;
  }

  getStore(key: string): Store | undefined {
    return this.datasets[this._stripFragment(key)];
  }

  getAllDatasets(): { [key: string]: Store } {
    return this.datasets;
  }

  getQuint(subject: OTerm, predicate: OTerm, object: OTerm, graph: OTerm, dataset: string | null) {
    if (dataset) {
      return this.datasets[this._stripFragment(dataset)].getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset));
    }
    const results = [];
    for (const [dataset, store] of Object.entries(this.datasets)) {
      results.push(store.getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset)));
    }
    return results.flat();
  }

  /**
   *
   * @param uri: the URI to strip from its fragment #
   * @return substring of the uri prior to fragment #
   */
  private _stripFragment(uri: string): string {
    const indexOfFragment = uri.indexOf("#");
    if (indexOfFragment !== -1) {
      uri = uri.substring(0, indexOfFragment);
    }
    return uri;
  }

}

const datasetStore = reactive(new DatasetStore());

export const useDatasetStore = () => {
  return { datasetStore };
};
