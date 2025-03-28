"use strict";

import { Parser, Prefixes, Quad, Store } from "n3";
import { AxiosHeaders, AxiosResponse } from "axios";
import { Session } from "@uvdsl/solid-oidc-client-browser";
import { LDP } from "./namespaces";

export interface ParsedN3 {
  store: Store;
  prefixes: Prefixes;
}

/**
 * #######################
 * ### BASIC REQUESTS  ###
 * #######################
 */

/**
 *
 * @param response http response, e.g. from axiosFetch
 * @throws Error, if response is not ok
 * @returns the response, if response is ok
 */
function _checkResponseStatus(
  response: AxiosResponse<any, any>
): AxiosResponse<any, any> {
  if (response.status >= 400) {
    throw new Error(
      `Action on \`${response.request.url}\` failed: \`${response.status}\` \`${response.statusText}\`.`
    );
  }
  return response;
}

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
 *
 * @param uri `<http://ex.org>`
 * @returns `http://ex.org` without the parentheses
 */
function _stripUriFromStartAndEndParentheses(uri: string): string {
  if (uri.startsWith("<")) uri = uri.substring(1, uri.length);
  if (uri.endsWith(">")) uri = uri.substring(0, uri.length - 1);
  return uri;
}

/**
 * Parse text/turtle to N3.
 * @param text text/turtle
 * @param baseIRI string
 * @return Promise ParsedN3
 */
export async function parseToN3(
  text: string,
  baseIRI: string
): Promise<ParsedN3> {
  const store = new Store();
  const parser = new Parser({
    baseIRI: _stripFragment(baseIRI),
    blankNodePrefix: "",
  }); // { blankNodePrefix: 'any' } does not have the effect I thought
  return new Promise((resolve, reject) => {
    // parser.parse is actually async but types don't tell you that.
    parser.parse(text, (error: Error, quad: Quad, prefixes: Prefixes) => {
      if (error) reject(error);
      if (quad) store.addQuad(quad);
      else resolve({ store, prefixes });
    });
  });
}

/**
 * Send a session.axiosFetch request: GET, uri, async requesting `text/turtle`
 *
 * @param uri: the URI of the text/turtle to get
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @param headers: OPTIONAL - headers to set manually (e.g. `Accept` or `baseIRI`), `content-type` is set by default to `text/turtle`.
 * @return Promise string of the response text/turtle
 */
export async function getResource(
  uri: string,
  session?: Session,
  headers?: Record<string, string>
): Promise<AxiosResponse<any, any>> {
  console.log("### SoLiD\t| GET\n" + uri);
  if (session === undefined) session = new Session();
  if (!headers) headers = {};
  headers["Accept"] = headers["Accept"]
    ? headers["Accept"]
    : "text/turtle,application/ld+json";
  return session
    .authFetch({ url: uri, method: "GET", headers: headers })
    .then(_checkResponseStatus);
}

/**
 * Send a session.axiosFetch request: POST, uri, async providing `text/turtle`
 * providing `text/turtle` and baseURI header, accepting `text/turtle`
 *
 * @param uri: the URI of the server (the text/turtle to post to)
 * @param body: OPTIONAL - the text/turtle to provide
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @param headers: OPTIONAL - headers to set manually (e.g. `Accept` or `baseIRI`), `content-type` is set by default to `text/turtle`.
 * @return Promise of the response
 */
export async function postResource(
  uri: string,
  body?: string,
  session?: Session,
  headers?: Record<string, string>
): Promise<AxiosResponse<any, any>> {
  if (session === undefined) session = new Session();
  if (!headers) headers = {};
  headers["Content-type"] = headers["Content-type"]
    ? headers["Content-type"]
    : "text/turtle";
  return session
    .authFetch({
      url: uri,
      method: "POST",
      headers: headers,
      data: body,
    })
    .then(_checkResponseStatus);
}

/**
 * Send a session.axiosFetch request: POST, location uri, container name, async .
 * This will generate a new URI at which the resource will be available.
 * The response's `Location` header will contain the URL of the created resource.
 *
 * @param uri: the URI of the resrouce to post to / to be located at
 * @param body: the body of the resource to create
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return Promise Response
 */
export async function createResource(
  locationURI: string,
  body: string,
  session?: Session,
  headers?: Record<string, string>
): Promise<AxiosResponse<any, any>> {
  console.log("### SoLiD\t| CREATE RESOURCE AT\n" + locationURI);
  if (!headers) headers = {};
  headers["Content-type"] = headers["Content-type"]
    ? headers["Content-type"]
    : "text/turtle";
  headers["Link"] = `<${LDP("Resource")}>; rel="type"`;
  return postResource(locationURI, body, session, headers);
}

/**
 * Send a session.axiosFetch request: POST, location uri, resource name, async .
 * If the container already exists, an additional one with a prefix will be created.
 * The response's `Location` header will contain the URL of the created resource.
 *
 * @param uri: the URI of the container to post to
 * @param name: the name of the container
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return Promise Response (location header not included (i think) since you know the name and folder)
 */
export async function createContainer(
  locationURI: string,
  name: string,
  session?: Session
): Promise<AxiosResponse<any, any>> {
  console.log("### SoLiD\t| CREATE CONTAINER\n" + locationURI + name + "/");
  const body = undefined;
  return postResource(locationURI, body, session, {
    Link: `<${LDP("BasicContainer")}>; rel="type"`,
    Slug: name,
  });
}

/**
 * Get the Location header of a newly created resource.
 * @param resp string location header
 */
export function getLocationHeader(resp: AxiosResponse<any, any>): string {
  if (!(resp.headers instanceof AxiosHeaders && resp.headers.has("Location"))) {
    throw new Error(`Location Header at \`${resp.request.url}\` not set.`);
  }
  let loc = resp.headers.get("Location");
  if (!loc) {
    throw new Error(
      `Could not get Location Header at \`${resp.request.url}\`.`
    );
  }
  loc = loc.toString();
  if (!loc.startsWith("http://") && !loc.startsWith("https://")) {
    loc = new URL(resp.request.url).origin + loc;
  }
  return loc;
}

/**
 * Shortcut to get the items in a container.
 *
 * @param uri The container's URI to get the items from
 * @returns string URIs of the items in the container
 */
export async function getContainerItems(uri: string, session?: Session) {
  console.log("### SoLiD\t| GET CONTAINER ITEMS\n" + uri);
  return getResource(uri, session)
    .then((resp) => resp.data)
    .then((txt) => parseToN3(txt, uri))
    .then((parsedN3) => parsedN3.store)
    .then((store) =>
      store.getObjects(uri, LDP("contains"), null).map((obj) => obj.value)
    );
}

/**
 * Send a session.axiosFetch request: PUT, uri, async providing `text/turtle`
 *
 * @param uri: the URI of the text/turtle to be put
 * @param body: the text/turtle to provide
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return Promise string  of the created URI from the response `Location` header
 */
export async function putResource(
  uri: string,
  body: string,
  session?: Session,
  headers?: Record<string, string>
): Promise<AxiosResponse<any, any>> {
  console.log("### SoLiD\t| PUT\n" + uri);
  if (session === undefined) session = new Session();
  if (!headers) headers = {};
  headers["Content-type"] = headers["Content-type"]
    ? headers["Content-type"]
    : "text/turtle";
  headers["Link"] = `<${LDP("Resource")}>; rel="type"`;
  return session
    .authFetch({
      url: uri,
      method: "PUT",
      headers: headers,
      data: body,
    })
    .then(_checkResponseStatus);
}

/**
 * Send a session.axiosFetch request: PATCH, uri, async providing `text/n3`
 *
 * @param uri: the URI of the text/n3 to be patch
 * @param body: the text/turtle to provide
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return Promise string  of the created URI from the response `Location` header
 */
export async function patchResource(
  uri: string,
  body: string,
  session?: Session
): Promise<AxiosResponse<any, any>> {
  console.log("### SoLiD\t| PATCH\n" + uri);
  if (session === undefined) session = new Session();
  return session
    .authFetch({
      url: uri,
      method: "PATCH",
      headers: { "Content-Type": "text/n3" },
      data: body,
    })
    .then(_checkResponseStatus);
}

/**
 * Send a session.axiosFetch request: DELETE, uri, async
 *
 * @param uri: the URI of the text/turtle to delete
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return true if http request successfull with status 204
 */
export async function deleteResource(
  uri: string,
  session?: Session
): Promise<boolean> {
  console.log("### SoLiD\t| DELETE\n" + uri);
  if (session === undefined) session = new Session();
  return session
    .authFetch({
      url: uri,
      method: "DELETE",
    })
    .then(_checkResponseStatus)
    .then(() => true);
}

/**
 * ####################
 * ## Access Control ##
 * ####################
 */

/**
 * `http://ex.org/test.txt` > `http://ex.org/` and `http://ex.org/test/` > `http://ex.org/test/`
 * @param uri the resource
 * @returns folder the resource is in; if the resource is a folder, the folder uri itself is returned
 */
function _getSameLocationAs(uri: string): string {
  return uri.substring(0, uri.lastIndexOf("/") + 1);
}

/**
 * `http://ex.org/test.txt` > `http://ex.org/` and `http://ex.org/test/` > `http://ex.org/`
 * @param uri the resource
 * @returns the URI of the parent resource, i.e. the folder where the resource lives
 */
function _getParentUri(uri: string): string {
  let parent: string;
  if (!uri.endsWith("/"))
    // uri is resource
    parent = _getSameLocationAs(uri);
  else
    parent = uri
      // get parent folder
      .substring(0, uri.length - 1)
      .substring(0, uri.lastIndexOf("/"));
  if (parent == "http://" || parent == "https://")
    throw new Error(`Parent not found: Reached root folder at \`${uri}\`.`); // reached the top
  return parent;
}

/**
 * Parses Header "Link", e.g. <.acl>; rel="acl", <.meta>; rel="describedBy", <http://www.w3.org/ns/ldp#Container>; rel="type", <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"
 *
 * @param txt string of the Link Header#
 * @returns the object parsed
 */
function _parseLinkHeader(txt: string): Record<string, Array<string> | string> {
  const parsedObj: Record<string, Array<string> | string> = {};
  const propArray = txt.split(",").map((obj) => obj.split(";"));
  for (const prop of propArray) {
    if (parsedObj[prop[1].trim().split('"')[1]] === undefined) {
      // first element to have this prop type
      parsedObj[prop[1].trim().split('"')[1]] = prop[0].trim();
    } else {
      // this prop type is already set
      const propArray = new Array(
        parsedObj[prop[1].trim().split('"')[1]]
      ).flat();
      propArray.push(prop[0].trim());
      parsedObj[prop[1].trim().split('"')[1]] = propArray;
    }
  }
  return parsedObj;
}

/**
 * Send a session.axiosFetch request: HEAD, uri, header `Link` as json obj
 *
 * @param uri: the URI of the text/turtle to get the access control file for
 * @param session: OPTIONAL - session.axiosFetch function to use, e.g. session.authFetch of a solid session
 * @return Json object of the Link header
 */
export async function getLinkHeader(
  uri: string,
  session?: Session
): Promise<Record<string, Array<string> | string>> {
  console.log("### SoLiD\t| HEAD\n" + uri);
  if (session === undefined) session = new Session();
  return session
    .authFetch({ url: uri, method: "HEAD" })
    .then(_checkResponseStatus)
    .then((resp) => {
      if (!(resp.headers instanceof AxiosHeaders && resp.headers.has("Link"))) {
        throw new Error(`Link Header at \`${resp.request.url}\` not set.`);
      }
      const linkHeader = resp.headers.get("Link");
      if (linkHeader == null) {
        throw new Error(
          `Could not get Link Header at \`${resp.request.url}\`.`
        );
      } else {
        return linkHeader.toString();
      }
    }) // e.g. <.acl>; rel="acl", <.meta>; rel="describedBy", <http://www.w3.org/ns/ldp#Container>; rel="type", <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"
    .then(_parseLinkHeader);
}

export async function getAclResourceUri(
  uri: string,
  session?: Session
): Promise<string> {
  console.log("### SoLiD\t| ACL\n" + uri);
  if (session === undefined) session = new Session();
  return getLinkHeader(uri, session)
    .then((lnk) => _stripUriFromStartAndEndParentheses(lnk.acl as string))
    .then((acl) => {
      if (acl.startsWith("http://") || acl.startsWith("https://")) {
        return acl;
      }
      return _getSameLocationAs(uri) + acl;
    });
}