// @ts-nocheck
import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
    try {
        const { token, title, body } = await req.json()
        
        if (!token) return new Response("No token provided", { status: 400 });

        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: token,
                notification: { title, body }
            })
        })
        
        const responseText = await res.text();
        return new Response(responseText)
    } catch (err) {
        return new Response(String(err), { status: 500 })
    }
})
