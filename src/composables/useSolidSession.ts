import { ClientDetails, Session } from "@uvdsl/solid-oidc-client-browser";
import { reactive } from "vue";

interface IuseSolidSession {
  session: Session;
  restoreSession: () => Promise<void>;
}

const clientDetails: ClientDetails = {
  client_id: "https://uvdsl.solid.aifb.kit.edu/test/client_id.jsonld",
  redirect_uris: [window.location.href],
  client_name: "uvdsl's Solid App Template"
};

const session = reactive(new Session(clientDetails));

async function restoreSession() {
  await session.handleRedirectFromLogin();
}

/**
 * Auto-re-login / and handle redirect after login
 * 
 * Use in App.vue like this
 * ```ts
    import { useSolidSession } from './composables/useSolidSession';
    const { restoreSession } = useSolidSession();
    // plain (without any routing framework)
    restoreSession()
    // but if you use a router, make sure it is ready
    router.isReady().then(restoreSession)
   ```
 */
export const useSolidSession = () => {
  return {
    session,
    restoreSession,
  } as IuseSolidSession;
};