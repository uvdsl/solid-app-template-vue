import { DynamicRegistrationClientDetails, DereferencableIdClientDetails, Session, SessionOptions } from "@uvdsl/solid-oidc-client-browser";
import { reactive } from "vue";

interface IuseSolidSession {
  session: Session;
  restoreSession: () => Promise<void>;
}

const clientDetails: DereferencableIdClientDetails = {
  client_id: "https://uvdsl.solid.aifb.kit.edu/test/client_id.jsonld",
};

// const clientDetails: DynamicRegistrationClientDetails = {
//   redirect_uris: [window.location.href],
//   client_name: "uvdsl's Solid App Template"
// };

const sessionOptions = { onSessionExpirationWarning: () => console.log("warning session will expire") } as SessionOptions

const session = reactive(new Session(clientDetails, sessionOptions));
session.restore();



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
  } as IuseSolidSession;
};