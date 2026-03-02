import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  order_id: string;
  payment_method: "credit_card" | "boleto";
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
  };
  return_url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appmaxApiKey = Deno.env.get("APPMAX_API_KEY");
    const appmaxApiSecret = Deno.env.get("APPMAX_API_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PaymentRequest = await req.json();
    const { order_id, payment_method, customer, return_url } = body;

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Map payment method to database-compatible value
    const dbPaymentMethod = payment_method === "credit_card" ? "card" : payment_method;

    // Check if we're in test mode (no credentials)
    const isTestMode = !appmaxApiKey || !appmaxApiSecret;

    if (isTestMode) {
      console.log("Running in TEST MODE - no real Appmax credentials configured");
      
      // Generate mock payment data for testing
      const mockPaymentId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record with mock data
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          amount: order.total,
          currency: order.currency || "BRL",
          provider: "appmax",
          method: dbPaymentMethod,
          status: "pending",
          provider_payment_id: mockPaymentId,
          payment_url: `${return_url}?test=true&payment_id=${mockPaymentId}`,
          raw_provider_response_json: {
            test_mode: true,
            message: "This is a test payment. Configure APPMAX_API_KEY and APPMAX_API_SECRET for real payments.",
          },
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      // In test mode, simulate immediate success after redirect
      // Return a test URL that will trigger the mock flow
      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          payment_id: payment.id,
          payment_url: `${return_url}?test=true&payment_id=${payment.id}`,
          message: "Modo de teste ativo. Configure as credenciais da Appmax para pagamentos reais.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // REAL MODE - Call Appmax API
    const appmaxBaseUrl = "https://admin.appmax.com.br/api/v3";

    // Build the payment request for Appmax
    const appmaxPayload = {
      access_token: appmaxApiKey,
      firstname: customer.name.split(" ")[0],
      lastname: customer.name.split(" ").slice(1).join(" ") || customer.name,
      email: customer.email,
      telephone: customer.phone.replace(/\D/g, ""),
      postcode: "00000000", // Will need to collect this
      address: "Endereço não informado",
      city: "Cidade",
      region: "Estado",
      country_id: "BR",
      ip: "0.0.0.0",
      products: order.order_items.map((item: any) => ({
        sku: item.id,
        name: item.description,
        qty: item.quantity,
        price: item.unit_amount,
      })),
      shipping_price: 0,
      payment_method_id: payment_method === "credit_card" ? "1" : "2", // 1 = credit, 2 = boleto
      callback_url: `${supabaseUrl}/functions/v1/webhook-appmax`,
    };

    const appmaxResponse = await fetch(`${appmaxBaseUrl}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appmaxApiKey}`,
      },
      body: JSON.stringify(appmaxPayload),
    });

    const appmaxData = await appmaxResponse.json();

    if (!appmaxResponse.ok) {
      throw new Error(`Appmax error: ${JSON.stringify(appmaxData)}`);
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        amount: order.total,
        currency: order.currency || "BRL",
        provider: "appmax",
        method: dbPaymentMethod,
        status: "pending",
        provider_payment_id: appmaxData.data?.id?.toString(),
        payment_url: appmaxData.data?.checkout_url || appmaxData.data?.boleto_url,
        boleto_url: dbPaymentMethod === "boleto" ? appmaxData.data?.boleto_url : null,
        boleto_barcode: dbPaymentMethod === "boleto" ? appmaxData.data?.boleto_line : null,
        raw_provider_response_json: appmaxData,
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        test_mode: false,
        payment_id: payment.id,
        payment_url: payment.payment_url,
        boleto_url: payment.boleto_url,
        boleto_barcode: payment.boleto_barcode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Appmax payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
