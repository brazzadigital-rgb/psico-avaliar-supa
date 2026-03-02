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
    const provider = "appmax";

    console.log("Received webhook from Appmax:", JSON.stringify(payload));

    // Store the webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        provider,
        event_type: payload.event || payload.type || "unknown",
        provider_event_id: payload.transaction_id?.toString() || payload.id?.toString() || null,
        payload_json: payload,
        status: "received",
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error storing webhook event:", webhookError);
    }

    // Process payment notifications
    if (payload.event === "transaction.paid" || payload.status === "paid") {
      const transactionId = payload.transaction_id || payload.id;
      
      if (transactionId) {
        // Find the payment in our database
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("*, order:orders(*)")
          .eq("provider_payment_id", transactionId.toString())
          .single();

        if (payment) {
          // Update payment status
          await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          // Update order
          if (payment.order) {
            await supabase
              .from("orders")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", payment.order.id);

            // Confirm appointment if exists
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

        // Mark webhook as processed
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

    // Handle failed/cancelled payments
    if (payload.event === "transaction.failed" || payload.event === "transaction.cancelled" || 
        payload.status === "failed" || payload.status === "cancelled") {
      const transactionId = payload.transaction_id || payload.id;
      
      if (transactionId) {
        const { data: payment } = await supabase
          .from("payments")
          .select("*")
          .eq("provider_payment_id", transactionId.toString())
          .single();

        if (payment) {
          await supabase
            .from("payments")
            .update({
              status: payload.status === "cancelled" ? "canceled" : "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);
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
