import { reactive } from "vue";
import { Session } from "@uvdsl/solid-oidc-client-browser";

interface IuseSolidSession {
  session: Session;
  restoreSession: () => Promise<void>;
}

const session = reactive(new Session());

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