import "server-only";

// Feed de Instagram vía Graph API (Meta) — solo servidor.
// El token INSTAGRAM_ACCESS_TOKEN se renueva ~cada 60 días desde Meta Developers.

export interface InstaMediaItem {
  id: string;
  image_url: string;
  post_url: string;
  is_video: boolean;
  timestamp: string;
}

export async function fetchInstagramFeed(limit = 12): Promise<InstaMediaItem[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(
      `https://graph.instagram.com/v22.0/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${encodeURIComponent(token)}`,
      { next: { revalidate: 3600 } } // caché de 1 hora (los media_url son temporales)
    );

    if (!res.ok) {
      console.warn("Instagram Graph API error:", res.status);
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
