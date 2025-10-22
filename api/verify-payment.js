// api/verify-payment.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Read the raw body directly from the stream
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ Invalid JSON body:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    console.error("❌ Missing payment fields:", data);
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Compute HMAC using secret
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  console.log("Expected Signature:", expected);
  console.log("Received Signature:", razorpay_signature);

  if (expected !== razorpay_signature) {
    console.error("❌ Signature mismatch");
    return res.status(400).json({ error: "Signature verification failed" });
  }

  console.log("✅ Payment verified successfully!");
  return res.status(200).json({ verified: true });
}
