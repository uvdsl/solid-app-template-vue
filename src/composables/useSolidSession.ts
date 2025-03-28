import { reactive } from "vue";
import { Session } from "@uvdsl/solid-oidc-client-browser";
import { AxiosRequestConfig } from "axios";

class RdpCapableSession extends Session {
  private rdp_: string | undefined;
  constructor(rdp: string) {
    super();
    if (rdp !== "") {
      this.updateSessionWithRDP(rdp);
    }
  }
  // @overwrite
  async authFetch(config: AxiosRequestConfig<any>, dpopPayload?: any) {
    const requestedURL = new URL(config.url!);
    if (this.rdp_ !== undefined && this.rdp_ !== "") {  // if RDP is present, then intercept!
      const requestURL = new URL(config.url!);
      requestURL.searchParams.set("host", requestURL.host); // extract original host from HTTP request and set as search parameter 'host'
      requestURL.host = new URL(this.rdp_).host; // set RDP as new host of the HTTP request 
      config.url = requestURL.toString(); // set the modified HTTP URI for the request (intercepted and modified for RDP usage)
    }
    if (!dpopPayload) {
      // create DPoP for the originally desired resource
      dpopPayload = {
        htu: `${requestedURL.protocol}//${requestedURL.host}${requestedURL.pathname}`,
        htm: config.method,
      };
    }
    return super.authFetch(config, dpopPayload);
  }
  updateSessionWithRDP(rdp: string) {
    this.rdp_ = rdp;
  }
  get rdp() {
    return this.rdp_;
  }
}

interface IuseSolidSessoin {
  session: RdpCapableSession;
  restoreSession: () => Promise<void>;
}

const session = reactive(new RdpCapableSession(""));

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
  } as IuseSolidSessoin;
};