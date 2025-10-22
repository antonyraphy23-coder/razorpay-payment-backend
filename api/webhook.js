// api/webhook.js
import crypto from "crypto";

export default async function handler(req, res) {
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  // Razorpay sends signature in this header
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.error("❌ Invalid webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ Invalid JSON:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  console.log("📦 Verified Razorpay Event:", event.event);
  console.log("🧾 Payload:", JSON.stringify(event.payload, null, 2));

  // Example event handling
  switch (event.event) {
    case "payment.authorized":
      console.log("✅ Payment authorized");
      break;
    case "payment.failed":
      console.log("⚠️ Payment failed");
      break;
    case "payment.captured":
      console.log("💰 Payment captured");
      break;
    default:
      console.log("ℹ️ Unhandled event type:", event.event);
  }

  res.status(200).json({ status: "ok" });
}
