// AuthenticateDevice.jsx
import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";

export async function authenticateDevice(username) {
  const { data: options } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/generate-authentication-options`, { username });

  const assertionResp = await startAuthentication(options);
  const verify = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/verify-authentication`, {
    username,
    assertionResponse: assertionResp,
  });

  return verify.data;
}
