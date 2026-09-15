import "server-only";

// Feed de Instagram (solo servidor). Soporta DOS modos:
//
// 1) API de Instagram (token de Instagram Login) — actual:
//    requiere INSTAGRAM_ACCESS_TOKEN. Token de ~60 días (renovable).
// 2) API de Facebook Graph con Usuario de Sistema (token PERMANENTE):
//    requiere INSTAGRAM_ACCESS_TOKEN (del System User) + INSTAGRAM_BUSINESS_ID.
//    Si INSTAGRAM_BUSINESS_ID está configurado, se usa este modo automáticamente.

export interface InstaMediaItem {
  id: string;
  image_url: string;
  post_url: string;
  is_video: boolean;
  timestamp: string;
}

const FIELDS = "id,media_type,media_url,thumbnail_url,permalink,timestamp";

export async function fetchInstagramFeed(limit = 12): Promise<InstaMediaItem[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  const businessId = process.env.INSTAGRAM_BUSINESS_ID;

  // Modo 2 (token permanente): Graph API de Facebook con el ID de la cuenta de Instagram Business
  const url = businessId
    ? `https://graph.facebook.com/v22.0/${businessId}/media?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`
    : `https://graph.instagram.com/v22.0/me/media?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // caché de 1 hora

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn("Instagram API error:", res.status, detail.slice(0, 300));
      return [];
    }

    const data = await res.json();
    const items = Array.isArray(data?.data) ? data.data : [];

    return items.map((m: Record<string, unknown>) => ({
      id: String(m.id || ""),
      // Para videos usamos el thumbnail; para imágenes, la media_url directa
      image_url: String(
        (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ||
          m.media_url ||
          m.thumbnail_url ||
          ""
      ),
      post_url: String(m.permalink || `https://www.instagram.com/p/${m.id}/`),
      is_video: m.media_type === "VIDEO",
      timestamp: String(m.timestamp || ""),
    }));
  } catch (error) {
    console.warn("Error obteniendo el feed de Instagram:", error);
    return [];
  }
}
