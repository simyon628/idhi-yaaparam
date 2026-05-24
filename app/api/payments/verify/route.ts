import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, entityId, entityType, statusToSet } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // NOTE: In development mode if you use placeholder keys this will fail.
      // We will add a bypass for local dev if real keys are missing.
      if (process.env.RAZORPAY_KEY_SECRET) {
         return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      } else {
         console.warn("Bypassing signature check since RAZORPAY_KEY_SECRET is not set.");
      }
    }

    // Payment is verified! Update Firestore
    if (entityId && entityType) {
      const collectionName = entityType === 'rental' ? 'rentals' : 'writing_jobs';
      await getAdminDb().collection(collectionName).doc(entityId).update({
        status: statusToSet || 'completed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paidAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
