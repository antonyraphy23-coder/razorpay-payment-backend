import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Payment verification endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      program_key,
      plan_key,
    } = req.body;

    // Verify all required fields are present
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required payment details',
      });
    }

    // Create signature to verify payment
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature matches
    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid payment signature',
      });
    }

    // Fetch payment details from Razorpay to confirm
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    return res.status(200).json({
      verified: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        email: payment.email,
        contact: payment.contact,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      verified: false,
      error: error.message || 'Payment verification failed',
    });
  }
}
