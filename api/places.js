// Vercel Function：POST /api/places
//   { action:"autocomplete", input, sessionToken } → { suggestions:[{placeId,name,sub}] }
//   { action:"details", placeId, sessionToken }    → { lat, lng, placeId }
// Google 金鑰只存在環境變數 GOOGLE_PLACES_API_KEY（需啟用 Places API (New)）。
const BASE = "https://places.googleapis.com/v1";

// 每個函式實例的簡易限流（盡力而為，無法取代 Google 端配額）
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 300;
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return arr.length > MAX_HITS;
}

const okToken = (t) => t == null || (typeof t === "string" && /^[A-Za-z0-9-]{8,64}$/.test(t));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // 只接受同網站來源（Origin 的主機必須等於本函式所在主機）
  let originHost = "";
  try { originHost = new URL(req.headers.origin || "").host; } catch (e) {}
  if (!originHost || originHost !== req.headers.host) return res.status(403).json({ error: "forbidden" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(503).json({ error: "not_configured" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || !okToken(b.sessionToken)) return res.status(400).json({ error: "bad_request" });

  try {
    if (b.action === "autocomplete") {
      const input = typeof b.input === "string" ? b.input.trim() : "";
      if (input.length < 1 || input.length > 100) return res.status(400).json({ error: "bad_request" });
      const r = await fetch(`${BASE}/places:autocomplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
        body: JSON.stringify({ input, sessionToken: b.sessionToken || undefined, languageCode: "zh-TW" }),
      });
      if (!r.ok) { console.error("places autocomplete status", r.status); return res.status(502).json({ suggestions: [] }); }
      const d = await r.json();
      const suggestions = (d.suggestions || [])
        .filter((s) => s.placePrediction && s.placePrediction.placeId)
        .slice(0, 8)
        .map((s) => {
          const p = s.placePrediction;
          return {
            placeId: p.placeId,
            name: (p.structuredFormat && p.structuredFormat.mainText && p.structuredFormat.mainText.text) || (p.text && p.text.text) || "",
            sub: (p.structuredFormat && p.structuredFormat.secondaryText && p.structuredFormat.secondaryText.text) || "",
          };
        });
      return res.status(200).json({ suggestions });
    }

    if (b.action === "details") {
      if (typeof b.placeId !== "string" || !/^[A-Za-z0-9_-]{10,300}$/.test(b.placeId)) return res.status(400).json({ error: "bad_request" });
      const qs = "languageCode=zh-TW" + (b.sessionToken ? `&sessionToken=${encodeURIComponent(b.sessionToken)}` : "");
      const r = await fetch(`${BASE}/places/${encodeURIComponent(b.placeId)}?${qs}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id,location" }, // 只取座標，避免多付欄位費用
      });
      if (!r.ok) { console.error("places details status", r.status); return res.status(502).json({ error: "upstream" }); }
      const d = await r.json();
      if (!d.location || typeof d.location.latitude !== "number" || typeof d.location.longitude !== "number")
        return res.status(502).json({ error: "no_location" });
      return res.status(200).json({ lat: d.location.latitude, lng: d.location.longitude, placeId: d.id || b.placeId });
    }

    return res.status(400).json({ error: "bad_request" });
  } catch (e) {
    console.error("places error", e && e.name);
    return res.status(502).json({ error: "upstream" });
  }
};
