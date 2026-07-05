import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc, type AuthFn } from "eve/channels/auth";

function demoUser(): AuthFn<Request> {
  return async () => ({
    attributes: { email: process.env.DEMO_USER_EMAIL || "demo@proofarena.local" },
    authenticator: "proofarena-demo",
    principalId: process.env.DEMO_USER_ID || "proofarena-demo-user",
    principalType: "user",
  });
}

export default eveChannel({
  auth: [
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Public hackathon demo. Replace with Auth.js, Clerk, or another verifier
    // before using this with sensitive production data.
    demoUser(),
  ],
});
