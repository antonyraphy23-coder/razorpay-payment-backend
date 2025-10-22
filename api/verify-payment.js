// api/verify-payment.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 🔹 Log: start of request
  console.log("📩 Incoming payment verification request...");
  console.log("📍 Headers:", req.headers);

  // Read the raw body manually
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  // 🔹 Log: raw body before parsing
  console.log("🧾 Raw body string received:", rawBody);

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ JSON parsing failed:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

  // 🔹 Log: parsed data object
  console.log("📦 Parsed data:", data);

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    console.error("❌ Missing required fields:", data);
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Compute expected signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // 🔹 Log: signature comparison details
  console.log("🔑 Expected Signature:", expected);
  console.log("📬 Received Signature:", razorpay_signature);

  if (expected !== razorpay_signature) {
    console.error("❌ Signature mismatch");
    return res.status(400).json({ error: "Signature verification failed" });
  }

  console.log("✅ Payment verified successfully!");
  return res.status(200).json({ verified: true });
}
