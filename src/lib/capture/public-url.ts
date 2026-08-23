import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "0.0.0.0",
  "metadata.google.internal",
  "metadata.google.internal.",
  "instance-data.ec2.internal",
]);

function isPrivateIpv4(host: string) {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true;

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(host: string) {
  const normalized = host.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home")
  ) {
    return true;
  }

  const ipVersion = isIP(host.replace(/^\[|\]$/g, ""));
  if (ipVersion === 4) return isPrivateIpv4(host);
  if (ipVersion === 6) return isPrivateIpv6(host);

  return false;
}

export class PublicUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUrlError";
  }
}

export function parsePublicReferenceUrl(input: string) {
  const candidate = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new PublicUrlError("Enter a complete public website URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new PublicUrlError("Only public HTTP and HTTPS websites can be captured.");
  }
  if (!url.hostname || isBlockedHost(url.hostname)) {
    throw new PublicUrlError("That address is not a public website.");
  }
  if (url.username || url.password) {
    throw new PublicUrlError("URLs containing credentials are not supported.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new PublicUrlError("Use a website served on the standard HTTP or HTTPS port.");
  }

  url.hash = "";
  return url;
}
