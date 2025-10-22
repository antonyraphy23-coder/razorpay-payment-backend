// api/webhook.js
export default async function handler(req, res) {
  console.log("📡 Razorpay Webhook event received");

  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ Invalid JSON in webhook:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  console.log("🧾 Webhook event type:", event.event);
  console.log("📦 Payload:", JSON.stringify(event.payload, null, 2));

  // Optional: Handle specific events
  switch (event.event) {
    case "payment.authorized":
      console.log("✅ Payment authorized event received");
      break;
    case "payment.failed":
      console.warn("⚠️ Payment failed event");
      break;
    default:
      console.log("ℹ️ Unhandled event type:", event.event);
  }

  // Always acknowledge webhook
  res.status(200).json({ status: "ok" });
}
