import { afterEach, describe, expect, it, vi } from "vitest";
import {
  API_BASE_URL,
  ApiError,
  createSubject,
  listSubjects,
} from "@/api/subjects";

function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/vnd.api+json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("subjects API client", () => {
  it("lists subjects from the JSON:API data array", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { data: [{ id: "1", attributes: {} }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listSubjects()).resolves.toEqual([
      { id: "1", attributes: {} },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/subjects`,
      expect.objectContaining({
        headers: { Accept: "application/vnd.api+json" },
      }),
    );
  });

  it("returns an empty list when the payload has no data array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {})));
    await expect(listSubjects()).resolves.toEqual([]);
  });

  it("posts a subjects resource and returns the created record", async () => {
    const created = { id: "7", attributes: { first_name: "Ada" } };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(201, { data: created }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createSubject({ first_name: "Ada" })).resolves.toEqual(
      created,
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/vnd.api+json");
    expect(JSON.parse(init.body)).toEqual({
      data: { type: "subjects", attributes: { first_name: "Ada" } },
    });
  });

  it("surfaces JSON:API error details from a 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          errors: [{ detail: "first_name can't be blank" }, { title: "Bad" }],
        }),
      ),
    );
    const error = await createSubject({}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe("first_name can't be blank Bad");
  });

  it("falls back to the status code when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<h1>oops</h1>", { status: 500 })),
    );
    await expect(listSubjects()).rejects.toThrow("status 500");
  });

  it("reports a network failure instead of failing silently", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const error = await listSubjects().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toContain("Could not reach the screening API");
  });
});
