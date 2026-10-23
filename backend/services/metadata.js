const dns = require("dns").promises;
const net = require("net");

const MAX_BYTES = 2 * 1024 * 1024;

function decode(value = "") {
  const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1].toLowerCase() === "x";
      return String.fromCodePoint(parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return entities[entity.toLowerCase()] || `&${entity};`;
  }).replace(/\s+/g, " ").trim();
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function isPrivate(address) {
  if (address === "::1" || address === "0.0.0.0" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return false;
}

async function validateUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS links are supported");
  const records = await dns.lookup(url.hostname, { all: true });
  if (!records.length || records.some(record => isPrivate(record.address))) throw new Error("Private network links are not allowed");
  return url;
}

async function fetchPage(rawUrl) {
  let url = await validateUrl(rawUrl);
  for (let redirects = 0; redirects < 5; redirects += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KastLinkPreview/1.0)", Accept: "text/html,application/xhtml+xml" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The website returned an invalid redirect");
      url = await validateUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`The website returned HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) throw new Error("This link is not an HTML page");
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); break; }
      chunks.push(value);
    }
    return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url };
  }
  throw new Error("Too many redirects");
}

function absolute(value, base) {
  if (!value) return "";
  try { return new URL(value, base).href; } catch { return ""; }
}

function jsonLdMetadata(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const entries = Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed];
      const entry = entries.find(item => item && (item.headline || item.name || item.image));
      if (entry) return { title: entry.headline || entry.name, description: entry.description, image: Array.isArray(entry.image) ? entry.image[0] : typeof entry.image === "object" ? entry.image.url : entry.image };
    } catch { /* Some sites publish malformed JSON-LD; other metadata still works. */ }
  }
  return {};
}

async function extractMetadata(rawUrl) {
  const { html, finalUrl } = await fetchPage(rawUrl);
  const meta = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = attributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (key && attrs.content && !meta[key]) meta[key] = attrs.content;
  }
  const links = (html.match(/<link\b[^>]*>/gi) || []).map(attributes);
  const icon = links.find(link => /(?:^|\s)(?:shortcut\s+)?icon(?:\s|$)/i.test(link.rel || "") && link.href);
  const canonical = links.find(link => (link.rel || "").toLowerCase() === "canonical" && link.href);
  const ld = jsonLdMetadata(html);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const domain = finalUrl.hostname.replace(/^www\./, "");
  const youtubeId = domain.match(/(^|\.)youtube\.com$/) ? finalUrl.searchParams.get("v") : domain === "youtu.be" ? finalUrl.pathname.slice(1).split("/")[0] : "";
  return {
    url: canonical ? absolute(canonical.href, finalUrl) : finalUrl.href,
    title: decode(meta["og:title"] || meta["twitter:title"] || ld.title || titleTag?.[1] || domain),
    caption: decode(meta["og:description"] || meta.description || meta["twitter:description"] || ld.description || ""),
    image: absolute(meta["og:image:secure_url"] || meta["og:image"] || meta["twitter:image"] || ld.image || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : ""), finalUrl),
    logo: absolute(icon?.href || "/favicon.ico", finalUrl),
    siteName: decode(meta["og:site_name"] || (youtubeId ? "YouTube" : domain)),
    domain,
  };
}

module.exports = { extractMetadata };
