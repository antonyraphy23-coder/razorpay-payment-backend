import Razorpay from "razorpay";

export default async function handler(req, res) {
  // ✅ Handle CORS properly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Parse and validate input
    const { amount, currency = "INR", receipt, notes } = req.body;

    console.log("🔍 Incoming create-order payload:", req.body);

    if (!amount || isNaN(amount)) {
      console.error("❌ Invalid or missing amount:", amount);
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // ✅ Initialize Razorpay each time inside the handler
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount), // Ensure it's an integer (in paise)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    console.log("🧾 Creating Razorpay order with options:", options);

    const order = await razorpay.orders.create(options);

    console.log("✅ Order created successfully:", order.id);

    // ✅ Always return this structure
    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID, // Send key ID to frontend for checkout
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create order",
    });
  }
}
