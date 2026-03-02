import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
  encryption: string;
  enabled: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get SMTP settings from site_settings
    const { data: smtpData, error: smtpError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    if (smtpError || !smtpData?.value) {
      return new Response(
        JSON.stringify({ success: false, error: "Configurações SMTP não encontradas" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      return new Response(
        JSON.stringify({ success: false, error: "Configurações SMTP incompletas" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.host,
        port: smtpSettings.port,
        tls: smtpSettings.encryption === "ssl",
        auth: {
          username: smtpSettings.username,
          password: smtpSettings.password,
        },
      },
    });

    // Send test email
    await client.send({
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: smtpSettings.from_email,
      subject: "Teste de Conexão SMTP - Psicoavaliar",
      content: "Este é um e-mail de teste para verificar a conexão SMTP.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0d4a3a;">Teste de Conexão SMTP</h2>
          <p>Parabéns! A conexão SMTP foi configurada corretamente.</p>
          <p style="color: #666; font-size: 12px;">Este e-mail foi enviado automaticamente pelo sistema Psicoavaliar.</p>
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "E-mail de teste enviado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("SMTP test error:", error);
    return new Response(
      JSON.stringify({ success: false, error: `Erro de conexão: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
