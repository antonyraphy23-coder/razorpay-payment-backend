import crypto from "crypto";

export default async function handler(req, res) {
  // ✅ Allow CORS for Framer or client domains
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      program_key,
      plan_key,
    } = req.body;

    // 🧩 Step 1: Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing required payment fields:", req.body);
      return res.status(400).json({
        success: false,
        error: "Missing payment verification fields",
      });
    }

    // 🧮 Step 2: Generate expected signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 🧾 Step 3: Compare signatures
    if (generatedSignature === razorpay_signature) {
      console.log("✅ Payment verified successfully:", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        program_key,
        plan_key,
      });

      return res.status(200).json({
        success: true,
        verified: true,
        message: "Payment verified successfully",
      });
    } else {
      console.error("❌ Invalid signature. Payment verification failed.", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        expected: generatedSignature,
        received: razorpay_signature,
      });

      return res.status(400).json({
        success: false,
        verified: false,
        error: "Invalid signature. Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("⚠️ Verification error:", error);
    return res.status(500).json({
      success: false,
      verified: false,
      error: error.message || "Internal Server Error",
    });
  }
}
