// api/verify-payment.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("📩 Incoming payment verification request...");

  // Read the raw request body (do NOT use express.json())
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  console.log("🧾 Raw body:", rawBody);

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ Invalid JSON:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    console.error("❌ Missing payment fields:", data);
    return res.status(400).json({ error: "Missing required payment fields" });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("❌ Missing RAZORPAY_KEY_SECRET environment variable");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Compute HMAC signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
