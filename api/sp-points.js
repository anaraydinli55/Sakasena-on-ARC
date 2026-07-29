import { Redis } from "@upstash/redis";

// Vercel KV veya Upstash Redis bağlantısını başlatıyoruz
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS başlıklarını ekleyelim
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  // OPTIONS isteklerini hızlıca yanıtla
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 1. GET İSTEĞİ: Cüzdanın mevcut puanını okur
  if (req.method === "GET") {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    const points = await redis.get(`sp_points:${address.toLowerCase()}`);
    return res.status(200).json({ points: points ? Number(points) : 0 });
  }

  // 2. POST İSTEĞİ: Puanı kaydeder veya artırır
  if (req.method === "POST") {
    const { address, pointsToSet, incrementBy } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const key = `sp_points:${address.toLowerCase()}`;

    // Göç ettirme (Migration): LocalStorage'daki eski puanı DB'ye yazar
    if (pointsToSet !== undefined) {
      const current = await redis.get(key);
      if (!current || Number(current) < Number(pointsToSet)) {
        await redis.set(key, Number(pointsToSet));
      }
      const finalPoints = await redis.get(key);
      return res.status(200).json({ points: Number(finalPoints) });
    }

    // Puan artırma: Mevcut puanı belirtilen miktar kadar artırır
    if (incrementBy !== undefined) {
      const finalPoints = await redis.incrby(key, Number(incrementBy));
      return res.status(200).json({ points: Number(finalPoints) });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).end("Method Not Allowed");
}
