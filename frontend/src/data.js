const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) localStorage.removeItem("token");
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export function normalizeLink(link) {
  const name = link.userName || link.userEmail || "Someone";
  return {
    ...link,
    source: link.siteName || link.domain || "Web",
    category: link.domain || "Link",
    excerpt: link.caption || "Saved without a note.",
    friend: name,
    initials: name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    time: link.timestamp ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(link.timestamp) : "Recently",
    saved: Boolean(link.likedByMe),
    color: ["clay", "sage", "blue", "gold"][Math.abs(String(link.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4],
  };
}

export async function getLinks() {
  return (await request("/api/links")).map(normalizeLink);
}

export async function createLink(link) {
  return normalizeLink(await request("/api/links", { method: "POST", body: JSON.stringify(link) }));
}

export async function previewLink(url) {
  return request("/api/links/preview", { method: "POST", body: JSON.stringify({ url }) });
}

export async function toggleLike(id) {
  return request(`/api/links/${id}/like`, { method: "POST" });
}
