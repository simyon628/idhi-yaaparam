import { useState, useCallback, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export function useRazorpay() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Razorpay SDK failed to load');
      toast.error('Failed to load payment gateway');
    };
    document.body.appendChild(script);
  }, []);

  const initiatePayment = useCallback(
    async ({
      amount,
      currency = 'INR',
      entityId,
      entityType,
      statusToSet = 'completed',
      onSuccess,
    }: {
      amount: number;
      currency?: string;
      entityId: string;
      entityType: 'rental' | 'writing_job';
      statusToSet?: string;
      onSuccess?: () => void;
    }) => {
      if (!isScriptLoaded) {
        toast.error('Payment gateway is still loading. Please try again in a moment.');
        return;
      }
      
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to make a payment.');
        return;
      }

      try {
        const token = await user.getIdToken();
        
        // 1. Create order on backend
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount, currency, receipt: entityId })
        });

        if (!orderRes.ok) throw new Error('Failed to create order');
        const orderData = await orderRes.json();

        // 2. Open Razorpay Checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Enter the Key ID generated from the Dashboard
          amount: orderData.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
          currency: orderData.currency,
          name: 'Idhi Yaaparam',
          description: `Payment for ${entityType} ${entityId}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            // 3. Verify payment on backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                entityId,
                entityType,
                statusToSet
              })
            });

            if (!verifyRes.ok) {
              toast.error('Payment verification failed.');
              return;
            }

            toast.success('Payment successful!');
            if (onSuccess) onSuccess();
          },
          prefill: {
            name: user.displayName || '',
            email: user.email || '',
          },
          theme: {
            color: '#5B4CDB'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error.description || 'Payment failed');
        });
        rzp.open();

      } catch (error) {
        console.error(error);
        toast.error('Failed to initiate payment.');
      }
    },
    [isScriptLoaded]
  );

  return { initiatePayment, isScriptLoaded };
}
