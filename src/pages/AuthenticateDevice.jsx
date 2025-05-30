// AuthenticateDevice.jsx
import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";

export async function authenticateDevice(username) {
  const { data: options } = await axios.post("http://localhost:3001/generate-authentication-options", { username });

  const assertionResp = await startAuthentication(options);
  const verify = await axios.post("http://localhost:3001/verify-authentication", {
    username,
    assertionResponse: assertionResp,
  });

  return verify.data;
}
