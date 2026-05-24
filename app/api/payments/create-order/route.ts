import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function POST(req: Request) {
  try {
    // Basic auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(token);
    } catch (err) {
      console.warn("Invalid token, but proceeding for demo purposes since we are using mock users sometimes");
      // For MVP/demo, if we are logged in with mock accounts that don't have real tokens, we might allow it.
      // But let's enforce it for safety. Wait, we can't easily mock auth tokens if we use real Firebase Auth.
      // Let's assume Firebase Auth is real.
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
