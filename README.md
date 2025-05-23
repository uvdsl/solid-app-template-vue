# Solid App Template (Vue Edition)

This is my template for Web Apps that follow the [Solid protocol](https://solidproject.org/TR/protocol) using [Vue](https://vuejs.org).

![app preview](img/app-preview.png)

## Quick Start
Use a somewhat recent node version, e.g. node v20.

```sh
# After cloning this repository: cd in there.
# install dependencies
npm install
# run developer mode
npm run dev
# go to http://localhost:5173
```

## Repository Structure

| **Directory/File**               | **Description**                                                                                   |
|----------------------------------|---------------------------------------------------------------------------------------------------|
| `.vscode/`                       | not important - just some VS Code settings                     |
| `img/`                           | not important - just the image directory for this README       |
| `public/`                        | Includes static assets such as icons                          |
| `src/`                           | Main source directory containing the core application code    |
| ├─ `assets/`                     | Static assets such as the app logo                            |
| ├─ `components/`                 | Reusable Vue components used throughout the app               |
| ├─ `composables/`                | Stateful objects such as Solid `session` and RDF `store`      |
| ├─ `views/`                      | "Panes"/"Pages" of the app (e.g. by re-using single components) |
| ├─ `App.vue`                     | Main Vue component - root of the app                                   |
| ├─ `main.ts`                     | Entry point of the application, initializing Vue and mounting the app. |
| `.env.example`                   | not important - Example environment configuration file.                 |
| `.gitignore`                     | not important - Specifies files and directories to be ignored by Git.   |
| `Dockerfile`                     | not important - Instructions to build a Docker image for the app.       |
| `README.md`                      | Documentation |
| `index.html`                     | not important - Main HTML file, Vue will inject the actual app. |
| `package-lock.json`              | not important - Locks versions of dependencies for consistent installs. |
| `package.json`                   | not important - Metadata, dependencies, scripts, and configurations for the project.   |
| `prod_nginx.conf`                | not important - Nginx configuration for production deployment.  |
| `tsconfig.app.json`              | not important - TypeScript configuration for the application.   |
| `tsconfig.json`                  | not important - Base TypeScript configuration file.  |
| `vite.config.ts`                 | not important - Configuration for Vite, the build tool used in this project.   |

New to Vue? Check out their awesome and beginner-friendly [tutorial](https://vuejs.org/guide/introduction.html).

#### Jump right in? 

The best starting point is `src/App.vue`: 

In the `<template>` section, we have a `content-header` which is the top bar (in the screenshot: Solid logo and the black text).
Then, we have the `content-background-pane` which is the dark center card with rounded corners.
This acts as the background for the components that you display.
Currently, there is the `src/views/LandingView.vue` displayed, as the user is not logged in yet: `v-if="!session.isActive"`.
When the user is logged in, the `src/views/ContentPane.vue` is displayed: `v-else`.
Kindly ignore the `Dialog` component, this belongs to the `serviceWorker` - don't worry about that for now.
Finally, there is the `Toast` component, which is a global component that you can trigger to show a temporary banner/message to a user to let them know what happens.

In the `<script>` section, we handle the redirect after a user logs in (`restoreSession`) and then give the `session` object to the Solid RDF Store (`store.setConfig({ session })`) such that the store can make authenticated requests.
Read more on the login and `session` in this [Solid-OIDC repository](https://github.com/uvdsl/solid-oidc-client-browser/).


To see the store in action, visit `src/components/ProfileHeader.vue`:

In the `<template>` section, we have the components of the profile header: the Solid logo, the black text, and some elements that are currently not visibile because the user is not logged in (profile photo and logout button).

In the `<script>` section, we watch the `session.webId` from `useSolidSession` to trigger code execution whenever the `session.webId` changes (e.g. when a user logs in).
Only then, the code in the `watch` clause is executed: First we check if a `webId` exists (if not, we have no WebId profile to query), and if it does, then we ask the Solid RDF Store `store` from `useSolidRdfStore` for the name and photo that is linked to the webId (i.e. the name and photo of the user).
In the background, the store fetches the dataset (the WebId profile) from the Web, parses the RDF data, queries the dataset, and returns a reactive result.
When the WebId profile is updated, and the store fetches the profile again, these results will automatically update, and so will the UI! This is achieved by using Vue's reactivity. Read more about that [here](https://vuejs.org/guide/essentials/reactivity-fundamentals).
It is important to use both `Ref` for the query results, and `computed` for the resulting values - otherwise the reactivity breaks and nothing will update. But if you do it like I show you here, it works nicely.

By the way, the store will only fetch the datasets once, on your first query to the dataset.
If you want the store to re-fetch the dataset - because you want to see if it was updated - you have to manually call `store.updateFromWeb(dataset)` where `dataset` is the URI of your dataset.
Read more on the `store` in the [Solid RDF Store repository](https://github.com/uvdsl/solid-rdf-store/).

If you want to write data, you can use functions provided by this small utiltiy repository, [Solid Requests](https://github.com/uvdsl/solid-requests/). 

Where should you start writing your own application logic? 
Start in `src/views/ContentPane.vue` as your entry component into this template.

## Additional Information

If you have any questions about this template, let me know!

#### Solid Protocol

If you are new to the [Solid Project](https://solidproject.org/): Hi and welcome! :wave:

In a nutshell, the Solid Protocol is a bundle of specifications that aims to decouple _identity_ (the account you use to log in), _application_ (the app you use), and _data_ (the stuff that the app uses).

The idea is that you should be able to use the same (and mostly your) data with different applications and using an account of your choice! 

That is, the Solid Project aims to break open data silos and to enable more control over where data is stored, how it is used and by whom.

#### This Template

This repository provides a template to create one such application where a user can log in with their account of choice (using their so-called [WebID](https://solid.github.io/webid-profile/)).

Then the application would then be able to discover where the user stores their data and use this data.
This part is up to you - this template does not provide any funcationality beyond login and logout.

But it does show you how you can get the user's data and discover more.

#### Good to know: libraries that I use and that you may want to use, too

For logging in, I use my
[Solid-OIDC implementation](https://github.com/uvdsl/solid-oidc-client-browser) which provides a `session` object that you can use to make authenticed HTTP requests. 
This `session` object is provided in the `useSolidSession` composable (e.g. see [here](https://github.com/uvdsl/solid-app-template-vue/blob/0802d1db81e231ba8930e2dd21f40d9436bdc46e/src/composables/useSolidSession.ts)).

For retrieving and querying RDF data from the Web, I use my [Solid RDF Store](https://github.com/uvdsl/solid-rdf-store), which uses [n3](https://github.com/rdfjs/N3.js) for parsing retrieved RDF data under the hood.
This Solid RDF Store can be configured to use the `session` object obtained after logging in, such that it can make authenticated requests (e.g. see [here](https://github.com/uvdsl/solid-app-template-vue/blob/0802d1db81e231ba8930e2dd21f40d9436bdc46e/src/App.vue#L12)).

For writing data or creating containers, I do that manually for now using my small [Solid Requests](https://github.com/uvdsl/solid-requests) utiltiy library.
When using this library, you can again supply the `session` object to make authenticated requests.
Have a look at the usage example in that repository.


#### User Interface

My UI framework of choice is [PrimeVue](https://primevue.org) in combination with their [icons](https://primeng.org/icons) and their layout utiltiy [PrimeFlex](https://primeflex.org/). If you want a different UI framework, feel free to throw away all of this and use your own!

#### PWA
By the way, this app template is actually a [Progressive Web App (PWA)](https://en.wikipedia.org/wiki/Progressive_web_app), which can be installed on a device from the browser itself.
If you see anyting related to a `serviceWorker` in this project, it is for this PWA part.
If you don't know what this is, don't worry and don't care too much! :smile:
If you already know a bit, you will find your way around.

## What about Data?

If you are curious, read on!

#### Where is data stored?

A user's data is stored on their Personal Online Datastore (Pod).
A Solid Pod is a Web servers that adhere to the Solid Protocol.

The Solid Pod provides data under access control.
The user is in control who to grant access.

More recently, the term _Solid Pod_ is not an official term anymore. The protocol calls it _Solid Storage_ now. 
It is a more technical name and gets rid of the focus on personal data.
User's can have mulitple Pods or Storages make open a (personal) data space.

#### How do I get a Solid Pod?
Have a look at the available [Pod Providers](https://solidproject.org/users/get-a-pod), pick one, and try it.

Or, host one yourself, e.g. the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer) - but this may be a bit advanced. Important: You can host it yourself! :smile:

## Is Solid only for personal data? What about B2B?
No!

The Solid Protocol is agnostic to the data that is stored or transmitted, it is even agonsitic to the database in which the data is actually stored.
The Solid Protocol standardizes the data access interface, authorization, authentication and agent identification.

Therefore, any data is good to be handled using the Solid Protocol!

If you want to read up on how this works in B2B environments, check out our [presentation video](https://vimeo.com/1061996736) (starting at 48:20 min) of the [MANDAT project](https://www.ti.rw.fau.de/projects/mandat/). There is code, too; see our open source [demo repository](https://github.com/mandat-project/hackathon-demo).

And, have a look at the our publications:

- Thorsten Kastner, Christoph Braun, Andreas Both, Dustin Yeboah, Sebastian Josef Schmid, Daniel Schraudner, Tobias Käfer, Andreas Harth: _Data-Sovereign Enterprise Collaboration using the Solid Protocol_. SEMANTiCS (Posters, Demos, Workshops & Tutorials) 2024 [[Open Access](https://ceur-ws.org/Vol-3759/paper10.pdf)]

- Andreas Both, Thorsten Kastner, Dustin Yeboah, Christoph Braun, Daniel Schraudner, Sebastian Schmid, Tobias Käfer, Andreas Harth: _AuthApp - Portable, Reusable Solid App for GDPR-Compliant Access Granting._ ICWE 2024: 199-214 [[Postprint, available starting 2025-06-16](https://publikationen.bibliothek.kit.edu/1000172187)]

- Andreas Both, Dustin Yeboah, Thorsten Kastner, Daniel Schraudner, Sebastian Schmid, Christoph Braun, Andreas Harth, Tobias Käfer: _Towards Solid-Based B2B Data Value Chains_. ESWC Satellite Events (1) 2024: 138-142 [[Open Access](https://2024.eswc-conferences.org/wp-content/uploads/2024/05/77770135.pdf)]

And some fun demos pushing the boundaries of the Solid Protocol using other technologies (that were hyped at the time):

- Christoph Braun, Tobias Käfer: _Attribute-based Access Control on Solid Pods using Privacy-friendly Credentials_. SEMANTiCS (Posters & Demos) 2022 [[Open Access](), [Website](https://uvdsl.solid.aifb.kit.edu/conf/2022/semantics/demo), [Code](https://github.com/uvdsl/solid-vc-pwa)]

- Hendrik Becker, Hung Vu, Anett Katzenbach, Christoph H.-J. Braun, Tobias Käfer: _Monetising Resources on a SoLiD Pod Using Blockchain Transactions_. ESWC (Satellite Events) 2021: 49-53 [[Open Access](http://people.aifb.kit.edu/co1683/2021/eswc-demo-solibra/solibra.pdf), [Website](http://people.aifb.kit.edu/co1683/2021/eswc-demo-solibra/), [Video](http://people.aifb.kit.edu/co1683/2021/eswc-demo-solibra/#v)]

- Christoph H.-J. Braun, Tobias Käfer: _A SoLiD App to Participate in a Scalable Semantic Supply Chain Network on the Blockchain (Demo)_. ISWC (Demos/Industry) 2020: 99-104 [[Open Accses](https://ceur-ws.org/Vol-2721/paper524.pdf), [Website](http://people.aifb.kit.edu/co1683/2020/iswc-demo-chain/), [Code](https://github.com/uvdsl/LinkedData-Logistics), [Video](http://people.aifb.kit.edu/co1683/2020/iswc-demo-chain/#v)]
