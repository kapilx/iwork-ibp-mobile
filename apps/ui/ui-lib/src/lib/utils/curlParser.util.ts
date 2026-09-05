// Regex-based cURL command parser — no external library. Understands the handful of
// flags TPAs' own docs/Postman exports actually use: -X/--request, -H/--header,
// --data*/-d/--body, -u/--user. Shared so every "paste a cURL, we'll fill in the fields"
// box in the app (API config forms, SSO remote-API config) parses it identically.
//
// --body (not a real curl flag, but what several TPAs' shared "postman request" docs
// use in place of --data/-d) must stay recognized here — dropping it silently leaves
// the payload body unparsed while URL/Method still look fine (URL is found by a plain
// https:// scan; Method defaults to POST), which reads as "half worked" rather than
// "unsupported flag", so don't reintroduce that gap by trimming this alternation.

export type PayloadFormat = "JSON" | "XML" | "FORM";

export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  bodyJson: Record<string, any> | null;
  bodyRaw: string;
  authType: string;
  payloadFormat: PayloadFormat;
  basicAuthUser: string;
  basicAuthPassword: string;
}

export const parseCurl = (raw: string): ParsedCurl => {
  const s = raw.replace(/\\\s*\n\s*/g, " ").trim();

  // Method — supports both -X and --request
  const methodMatch = s.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/i);
  const method = (methodMatch?.[1]?.toUpperCase() ?? "POST") as string;

  // URL — first https?:// value (handles --location too)
  const urlMatch = s.match(/(https?:\/\/[^\s'"\\]+)/i);
  const url = (urlMatch?.[1] ?? "").replace(/['"]/g, "").replace(/\/$/, "");

  // Headers — supports both -H and --header
  const headers: Record<string, string> = {};
  const hRe = /(?:-H|--header)\s+(['"])(.*?)\1/g;
  let hm: RegExpExecArray | null;
  while ((hm = hRe.exec(s)) !== null) {
    const colon = hm[2].indexOf(":");
    if (colon > 0) {
      headers[hm[2].slice(0, colon).trim()] = hm[2].slice(colon + 1).trim();
    }
  }

  // Body — supports --data, --data-raw, --data-binary, -d, --body
  const bodyRe = /(?:--data(?:-raw|-binary|-urlencode)?|-d|--body)\s+(['"])([\s\S]*?)\1/g;
  const bm = bodyRe.exec(s);
  const bodyRaw = (bm?.[2] ?? "").replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"');
  let bodyJson: Record<string, any> | null = null;
  if (bodyRaw.trim().startsWith("{")) try { bodyJson = JSON.parse(bodyRaw); } catch { /* not valid JSON — leave null */ }

  // Basic auth — supports -u and --user
  const basicMatch = s.match(/(?:-u|--user)\s+(['"]?)([^:'"\\s]+):([^'"\\s]+)\1/);

  const authHeader = headers["Authorization"] ?? headers["authorization"] ?? "";
  let authType = "DIRECT";
  let basicAuthUser = "";
  let basicAuthPassword = "";

  // -u / --user flag always means 2-step BASIC_AUTH (credentials for token endpoint)
  if (basicMatch) {
    authType = "BASIC_AUTH"; basicAuthUser = basicMatch[2]; basicAuthPassword = basicMatch[3];
  } else if (authHeader.startsWith("Basic ")) {
    // Hardcoded Base64 Basic Auth in a single cURL = static credential, no Step 1 token endpoint
    // Keep as DIRECT — Authorization stays in headers as a static value
    // (BASIC_AUTH in our system means 2-step: fetch token first, then use it)
    authType = "DIRECT";
  } else if (authHeader.startsWith("Bearer ")) {
    // Static Bearer token in a single cURL = SESSION type (Step 1 fetches the real token)
    authType = "SESSION";
  } else if (authHeader) {
    authType = "SESSION";
  }

  // Heuristic: URL path looks like an auth/login endpoint AND body contains credential fields
  // → treat as SESSION (Step 1 credential-submission endpoint that returns a token)
  if (authType === "DIRECT" && url) {
    const urlHasAuthPath = /\/(auth|login|token|credentials?|signin|sign[_-]in|oauth|validate|session|access)[^/]*/i.test(url);
    const bodyHasCredKeys = bodyJson != null && Object.keys(bodyJson).some((k) =>
      /^(password|passwd|username|userName|secret|encryptedKey|encrptedKey|apikey|api_key|passphrase)$/i.test(k),
    );
    if (urlHasAuthPath && bodyHasCredKeys) authType = "SESSION";
  }

  // Remove content-type (handled by payloadFormat field)
  // Keep Authorization header if DIRECT — admin needs to see it as a static header
  const ctKey = Object.keys(headers).find((k) => k.toLowerCase() === "content-type") ?? "";
  const ctVal = ctKey ? headers[ctKey] : "";
  const authKey = Object.keys(headers).find((k) => k.toLowerCase() === "authorization") ?? "";
  if (ctKey) delete headers[ctKey];
  // Only remove Authorization if we're handling it via auth config (SESSION/BASIC_AUTH)
  if (authKey && authType !== "DIRECT") delete headers[authKey];

  let payloadFormat: PayloadFormat = "JSON";
  if (ctVal.includes("xml")) payloadFormat = "XML";
  else if (ctVal.includes("form-urlencoded")) payloadFormat = "FORM";

  return { method, url, headers, bodyJson, bodyRaw, authType, payloadFormat, basicAuthUser, basicAuthPassword };
};
