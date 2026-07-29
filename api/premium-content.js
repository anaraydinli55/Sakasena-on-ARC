import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";

const client = createThirdwebClient({ 
  secretKey: process.env.THIRDWEB_SECRET_KEY 
});

const thirdwebX402Facilitator = facilitator({
  client,
  serverWalletAddress: process.env.NEXT_PUBLIC_SERVER_WALLET_ADDRESS,
});

export default async function handler(req, res) {
  // Sadece GET isteklerine izin veriyoruz
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  // Node.js üzerinde başlıklar (headers) küçük harflerle req.headers objesinden okunur
  const paymentData = req.headers["x-payment"];

  // Ödemeyi doğrula
  const result = await settlePayment({
    resourceUrl: "https://sakasena-on-arc.vercel.app/api/premium-content",
    method: "GET",
    paymentData: paymentData,
    network: "eip155:5042002", // Arc Testnet
    price: "$0.01",
    facilitator: thirdwebX402Facilitator,
    // 💎 ÖDEMELERİN DOĞRUDAN SİZİN CÜZDANINIZA GELMESİ İÇİN:
    payTo: "0xf8d59231bD1c74b8878cCF244C4dFFf412C872F5",
  });

  if (result.status === 200) {
    // Ödeme başarılı, premium içeriği JSON olarak dönüyoruz
    return res.status(200).json({ 
      success: true, 
      data: "Premium içeriğe başarıyla eriştiniz!" 
    });
  } else {
    // Ödeme eksikse gerekli x402 ödeme başlıklarını (headers) Node.js yanıtına ekliyoruz
    if (result.responseHeaders) {
      if (typeof result.responseHeaders.forEach === "function") {
        result.responseHeaders.forEach((value, key) => {
          res.setHeader(key, value);
        });
      } else {
        for (const [key, value] of Object.entries(result.responseHeaders)) {
          res.setHeader(key, value);
        }
      }
    }
    // HTTP 402 durum kodunu ve ödeme yönergelerini JSON olarak dönüyoruz
    return res.status(result.status).json(result.responseBody);
  }
}
