import { GoogleAuth } from "google-auth-library";

let authClient: GoogleAuth | null = null;

export async function getGoogleAuthClient() {
  if (!authClient) {
    try {
      const credentials = process.env.GOOGLE_CREDENTIALS_BASE64;
      if (!credentials) {
        throw new Error(
          "Google Cloud credentials not found in environment variables",
        );
      }

      // Decode base64 credentials
      const decodedCredentials = Buffer.from(credentials, "base64").toString();
      const parsedCredentials = JSON.parse(decodedCredentials);

      authClient = new GoogleAuth({
        credentials: parsedCredentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
    } catch (error) {
      console.error("Error initializing Google Auth client:", error);
      throw error;
    }
  }
  return authClient;
}
