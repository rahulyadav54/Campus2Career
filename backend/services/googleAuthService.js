import { OAuth2Client } from "google-auth-library";

let oauthClient = null;

function getClient() {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  if (!oauthClient) oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return oauthClient;
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

/** Verify Google ID token from the frontend Sign-In button */
export async function verifyGoogleIdToken(idToken) {
  const client = getClient();
  if (!client) {
    throw new Error("Google sign-in is not configured on the server");
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) {
    throw new Error("Invalid Google account payload");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || "",
  };
}

export default { verifyGoogleIdToken, isGoogleAuthConfigured };
