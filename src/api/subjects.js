const JSON_API = "application/vnd.api+json";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost/api/v1"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// JSON:API servers report validation problems as errors[].detail (or title).
function errorMessageFrom(body, status) {
  const messages = (body?.errors ?? [])
    .map((error) => error.detail || error.title)
    .filter(Boolean);
  if (messages.length) return messages.join(" ");
  return `The screening API answered with status ${status}.`;
}

async function request(path, init = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: JSON_API, ...init.headers },
    });
  } catch {
    throw new ApiError(
      `Could not reach the screening API at ${API_BASE_URL}.`,
      0,
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      errorMessageFrom(body, response.status),
      response.status,
    );
  }
  return body;
}

export async function listSubjects() {
  const body = await request("/subjects");
  return Array.isArray(body?.data) ? body.data : [];
}

export async function createSubject(attributes) {
  const body = await request("/subjects", {
    method: "POST",
    headers: { "Content-Type": JSON_API },
    body: JSON.stringify({ data: { type: "subjects", attributes } }),
  });
  if (!body?.data) {
    throw new ApiError("The screening API returned an empty response.", 0);
  }
  return body.data;
}
