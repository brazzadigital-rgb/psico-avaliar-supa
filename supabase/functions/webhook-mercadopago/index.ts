import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const provider = "mercadopago";

    console.log("Received webhook from Mercado Pago:", JSON.stringify(payload));

    // Store the webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        provider,
        event_type: payload.type || payload.action || "unknown",
        provider_event_id: payload.id?.toString() || null,
        payload_json: payload,
        status: "received",
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error storing webhook event:", webhookError);
    }

    // Process payment notifications
    if (payload.type === "payment" || payload.action === "payment.updated") {
      const paymentId = payload.data?.id;
      
      if (paymentId) {
        // In production, you would fetch the payment status from Mercado Pago API
        // For now, we'll simulate processing based on the webhook data
        
        // Find the payment in our database by provider_payment_id
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("*, order:orders(*)")
          .eq("provider_payment_id", paymentId.toString())
          .single();

        if (payment) {
          // Simulate payment status update (in production, fetch from MP API)
          const newStatus = payload.action === "payment.approved" ? "paid" : 
                           payload.action === "payment.cancelled" ? "canceled" : 
                           "pending";

          // Update payment status
          await supabase
            .from("payments")
            .update({
              status: newStatus,
              paid_at: newStatus === "paid" ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          // If paid, update order and appointment
          if (newStatus === "paid" && payment.order) {
            await supabase
              .from("orders")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", payment.order.id);

            // If there's an associated appointment, confirm it
            if (payment.order.appointment_id) {
              await supabase
                .from("appointments")
                .update({
                  status: "confirmed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", payment.order.appointment_id);
            }
          }
        }

        // Update webhook event as processed
        if (webhookEvent) {
          await supabase
            .from("webhook_events")
            .update({
              status: "processed",
              processed_at: new Date().toISOString(),
            })
            .eq("id", webhookEvent.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const error = err as Error;
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
