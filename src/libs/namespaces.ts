"use strict";

/**
 * Concat the RDF namespace identified by the prefix used as function name
 * with the RDF thing identifier as function parameter,
 * e.g. FOAF("knows") resovles to "http://xmlns.com/foaf/0.1/knows"
 * @param namespace uri of the namesapce
 * @returns function which takes a parameter of RDF thing identifier as string
 */
function Namespace(namespace: string) {
    return (thing?: string) => thing ? namespace.concat(thing) : namespace;
}

// Namespaces as functions where their parameter is the RDF thing identifier => concat, e.g. FOAF("knows") resolves to "http://xmlns.com/foaf/0.1/knows"
export const FOAF = Namespace("http://xmlns.com/foaf/0.1/");
export const DCT = Namespace("http://purl.org/dc/terms/");
export const RDF = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
export const RDFS = Namespace("http://www.w3.org/2000/01/rdf-schema#");
export const WDT = Namespace("http://www.wikidata.org/prop/direct/");
export const WD = Namespace("http://www.wikidata.org/entity/");
export const LDP = Namespace("http://www.w3.org/ns/ldp#");
export const ACL = Namespace("http://www.w3.org/ns/auth/acl#");
export const AS = Namespace("https://www.w3.org/ns/activitystreams#");
export const XSD = Namespace("http://www.w3.org/2001/XMLSchema#");
export const VCARD = Namespace("http://www.w3.org/2006/vcard/ns#");
export const SEC = Namespace("https://w3id.org/security#")
export const SPACE = Namespace("http://www.w3.org/ns/pim/space#")
export const SCHEMA = Namespace("http://schema.org/")
export const SKOS = Namespace("http://www.w3.org/2004/02/skos/core#")
export const ORG = Namespace("http://www.w3.org/ns/org#")

export const SOLID = Namespace("http://www.w3.org/ns/solid/terms#")
export const INTEROP = Namespace("http://www.w3.org/ns/solid/interop#")

export const PUSH = Namespace("https://purl.org/solid-web-push/vocab#");
export const WILD = Namespace("http://purl.org/wild/vocab#");