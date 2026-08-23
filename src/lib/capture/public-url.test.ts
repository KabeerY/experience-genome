import { describe, expect, it } from "vitest";

import { parsePublicReferenceUrl, PublicUrlError } from "./public-url";

describe("parsePublicReferenceUrl", () => {
  it("normalizes a public host and removes fragments", () => {
    expect(parsePublicReferenceUrl("the-goonies.webflow.io/#cast").toString()).toBe(
      "https://the-goonies.webflow.io/",
    );
  });

  it.each([
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://10.1.2.3",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]",
    "https://user:secret@example.com",
    "https://example.com:8443",
  ])("rejects a non-public or credential-bearing target: %s", (input) => {
    expect(() => parsePublicReferenceUrl(input)).toThrow(PublicUrlError);
  });
});
