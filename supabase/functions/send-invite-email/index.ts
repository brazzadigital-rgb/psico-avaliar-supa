import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  role: string;
  token: string;
  invitedBy?: string;
}

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
  // Handle CORS preflight requests
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
      console.error("SMTP settings not found:", smtpError);
      return new Response(
        JSON.stringify({ error: "SMTP não configurado. Configure em Configurações > SMTP." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.enabled) {
      console.log("SMTP is disabled");
      return new Response(
        JSON.stringify({ error: "Envio de e-mails está desativado. Ative em Configurações > SMTP." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      return new Response(
        JSON.stringify({ error: "Configurações SMTP incompletas. Verifique host, usuário e senha." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, role, token, invitedBy }: InviteEmailRequest = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "E-mail e token são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get site URL for the invite link
    const siteUrl = Deno.env.get("SITE_URL") || "https://wellspring-clinic-suite.lovable.app";
    const inviteLink = `${siteUrl}/cadastro?invite=${token}`;

    // Get role display name
    const roleNames: Record<string, string> = {
      admin: "Administrador",
      professional: "Profissional",
      receptionist: "Recepcionista",
      client: "Cliente",
    };
    const roleName = roleNames[role] || role;

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - Psicoavaliar</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d4a3a 0%, #1a6b52 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Psicoavaliar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Clínica de Psicologia e Saúde Mental</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0d4a3a; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Você foi convidado!</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${invitedBy ? `<strong>${invitedBy}</strong> convidou você` : "Você foi convidado"} para fazer parte da equipe Psicoavaliar como <strong>${roleName}</strong>.
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Clique no botão abaixo para criar sua conta e começar a usar o sistema:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #0d4a3a 0%, #1a6b52 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(13, 74, 58, 0.3);">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="color: #0d4a3a; font-size: 14px; word-break: break-all; margin: 10px 0 0;">
                ${inviteLink}
              </p>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
              
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este e-mail.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

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

    // Send email
    await client.send({
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: email,
      subject: `Convite para ${roleName} - Psicoavaliar`,
      content: `Você foi convidado para fazer parte da equipe Psicoavaliar como ${roleName}. Acesse: ${inviteLink}`,
      html: htmlContent,
    });

    await client.close();

    console.log("Invite email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "E-mail de convite enviado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao enviar e-mail: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
