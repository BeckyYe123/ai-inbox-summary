import axios from "axios";
import { config } from "../config";

export async function exchangeCodeForGrant(code: string) {
  const response = await axios.post(
    "https://api.us.nylas.com/v3/connect/token",
    {
      client_id: config.nylasClientId,
      client_secret: config.nylasApiKey,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.nylasCallbackUri,
      code_verifier: "nylas",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

export async function getAccount(grantId: string) {
  const response = await axios.get(
    `https://api.us.nylas.com/v3/grants/${grantId}`,
    {
      headers: {
        Authorization: `Bearer ${config.nylasApiKey}`,
      },
    }
  );

  return response.data;
}

export async function fetchInboxMessages(grantId: string) {
  const response = await axios.get(
    `https://api.us.nylas.com/v3/grants/${grantId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${config.nylasApiKey}`,
      },
      params: {
        limit: 10,
      },
    }
  );

  return response.data.data;
}

export async function sendEmail(grantId: string, to: string, subject: string, body: string) {
  const response = await axios.post(
    `https://api.us.nylas.com/v3/grants/${grantId}/messages/send`,
    {
      to: [{ email: to }],
      subject,
      body,
    },
    {
      headers: {
        Authorization: `Bearer ${config.nylasApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

export async function fetchMessageById(grantId: string, messageId: string) {
  const response = await axios.get(
    `https://api.us.nylas.com/v3/grants/${grantId}/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${config.nylasApiKey}`,
      },
    }
  );

  return response.data.data;
}
