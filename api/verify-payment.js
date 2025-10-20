export const config = {
  runtime: "nodejs18.x",
};

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, message: "Method not allowed" });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing required fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({ verified: true });
    } else {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ verified: false, error: "Internal server error" });
  }
}
