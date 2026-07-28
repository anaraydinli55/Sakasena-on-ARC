import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { arbitrumSepolia } from "thirdweb/chains";

// Vercel'in modern ve hızlı Edge fonksiyon yapısını kullanması için:
export const config = {
  runtime: 'edge', 
};

const client = createThirdwebClient({ 
  secretKey: process.env.THIRDWEB_SECRET_KEY 
});

const thirdwebX402Facilitator = facilitator({
  client,
  serverWalletAddress: process.env.NEXT_PUBLIC_SERVER_WALLET_ADDRESS,
});

export default async function handler(request) {
  // Sadece GET isteklerine izin veriyoruz
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const paymentData = request.headers.get("x-payment");

  // Ödemeyi doğrula ve on-chain (zincir üzerinde) onayla
  const result = await settlePayment({
    resourceUrl: "https://sakasena-on-arc.vercel.app/api/premium-content",
    method: "GET",
    paymentData: paymentData,
    network: arbitrumSepolia,
    price: "$0.01",
    facilitator: thirdwebX402Facilitator,
  });

  if (result.status === 200) {
    // Ödeme başarılı, premium veriyi JSON olarak istemciye dönüyoruz
    return new Response(
      JSON.stringify({ success: true, data: "Premium içeriğe başarıyla eriştiniz!" }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } else {
    // Ödeme yoksa veya eksikse, istemciye HTTP 402 durum kodu ve ödeme yönergelerini dönüyoruz
    return new Response(JSON.stringify(result.responseBody), {
      status: result.status,
      headers: result.responseHeaders,
    });
  }
}
