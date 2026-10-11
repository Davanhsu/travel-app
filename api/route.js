// Vercel Function：POST /api/route
// 輸入 { from:{lat,lng}, to:{lat,lng}, mode:"walk"|"transit", departureTime?:ISO8601 }
// 輸出 { min:<分鐘> }，查不到時回 { min:null }。Google 金鑰只存在環境變數 GOOGLE_ROUTES_API_KEY。
const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

// 每個函式實例的簡易限流（盡力而為，無法取代 Google 端配額）
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 120;
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return arr.length > MAX_HITS;
}

const validPt = (p) =>
  p && typeof p.lat === "number" && typeof p.lng === "number" &&
  Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

async function callRoutes(key, from, to, travelMode, departureTime) {
  const body = {
    origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
    destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
    travelMode,
  };
  if (travelMode === "TRANSIT" && departureTime) body.departureTime = departureTime;
  const r = await fetch(ROUTES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.duration",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, status: r.status };
  const d = await r.json();
  const sec = parseInt(String(d?.routes?.[0]?.duration || "").replace("s", ""), 10);
  return { ok: true, min: Number.isFinite(sec) ? Math.max(1, Math.round(sec / 60)) : null };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // 只接受同網站來源（Origin 的主機必須等於本函式所在主機）
  const origin = req.headers.origin || "";
  let originHost = "";
  try { originHost = new URL(origin).host; } catch (e) {}
  if (!originHost || originHost !== req.headers.host) return res.status(403).json({ error: "forbidden" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (!key) return res.status(503).json({ error: "not_configured" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || !validPt(b.from) || !validPt(b.to) || (b.mode !== "walk" && b.mode !== "transit"))
    return res.status(400).json({ error: "bad_request" });

  const travelMode = b.mode === "walk" ? "WALK" : "TRANSIT";

  // 大眾運輸：出發時間不能是過去，過去的日期順延到未來同一星期的同一時刻
  let depart = null;
  if (travelMode === "TRANSIT" && typeof b.departureTime === "string") {
    let t = Date.parse(b.departureTime);
    if (!isNaN(t)) {
      const now = Date.now() + 5 * 60 * 1000;
      while (t < now) t += 7 * 24 * 3600 * 1000;
      depart = new Date(t).toISOString();
    }
  }

  try {
    let out = await callRoutes(key, b.from, b.to, travelMode, depart);
    // 指定時間查不到（例如班表尚未公布）時，改用現在時間再查一次
    if ((!out.ok || out.min == null) && depart) out = await callRoutes(key, b.from, b.to, travelMode, null);
    if (!out.ok) {
      console.error("routes api status", out.status);
      return res.status(502).json({ min: null });
    }
    return res.status(200).json({ min: out.min });
  } catch (e) {
    console.error("routes api error", e && e.name);
    return res.status(502).json({ min: null });
  }
};
