import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentEmailRequest {
  appointmentCode: string;
  recipientEmail: string;
  recipientName: string;
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

interface AppointmentData {
  code: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  modality: string;
  service: {
    name: string;
    duration_minutes: number;
  };
  client: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get SMTP settings
    const { data: smtpData, error: smtpError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    if (smtpError || !smtpData?.value) {
      return new Response(
        JSON.stringify({ error: "SMTP não configurado. Configure em Configurações > SMTP." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.enabled) {
      return new Response(
        JSON.stringify({ error: "Envio de e-mails está desativado." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { appointmentCode, recipientEmail, recipientName }: AppointmentEmailRequest = await req.json();

    if (!appointmentCode || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Código do agendamento e e-mail são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        service:services(name, duration_minutes),
        client:clients(full_name, email, phone)
      `)
      .eq("code", appointmentCode)
      .single();

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({ error: "Agendamento não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://avaliar.packmasterlegacy.net";
    const consultaLink = `${siteUrl}/consulta/${appointmentCode}`;
    const confirmacaoLink = `${siteUrl}/agendar/confirmacao?code=${appointmentCode}`;

    const isOnline = appointment.modality === "online";
    const modalityText = isOnline ? "Online (Videoconferência)" : "Presencial";
    const modalityColor = isOnline ? "#f59e0b" : "#0d4a3a";

    // Format date
    const dateObj = new Date(appointment.scheduled_date + "T00:00:00");
    const formattedDate = dateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // Instructions based on modality
    const instructions = isOnline
      ? `
        <li>Você receberá o link da videoconferência por e-mail algumas horas antes da consulta</li>
        <li>Certifique-se de estar em um ambiente tranquilo e com boa conexão de internet</li>
        <li>Teste sua câmera e microfone antes do horário agendado</li>
        <li>Acesse o link com 5 minutos de antecedência</li>
      `
      : `
        <li>Chegue com 10 minutos de antecedência para realizar o cadastro na recepção</li>
        <li>Traga um documento de identificação com foto</li>
        <li>Se houver, traga exames, laudos ou relatórios anteriores</li>
        <li>Em caso de cancelamento, avise com pelo menos 24 horas de antecedência</li>
      `;

    const addressSection = isOnline
      ? `
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">💻 Consulta Online</p>
          <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">
            O link da videoconferência será enviado para seu e-mail e estará disponível no seu painel do cliente.
          </p>
        </div>
      `
      : `
        <div style="background-color: #ecfdf5; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <p style="margin: 0; font-weight: 600; color: #047857;">📍 Endereço</p>
          <p style="margin: 8px 0 0; color: #065f46; font-size: 14px;">
            Rua João Salomoni, 650 - Vila Nova<br>
            Porto Alegre - RS, CEP 91740-830
          </p>
        </div>
      `;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ficha de Agendamento - Psicoavaliar</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d4a3a 0%, #1a6b52 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Psicoavaliar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Centro de Psicologia</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0d4a3a; margin: 0 0 10px; font-size: 24px; font-weight: 600;">📋 Ficha de Agendamento</h2>
              <p style="color: #666666; margin: 0 0 30px; font-size: 14px;">
                Olá ${recipientName}, segue abaixo os detalhes do seu agendamento.
              </p>
              
              <!-- Appointment Code -->
              <div style="background: linear-gradient(135deg, #0d4a3a 0%, #1a6b52 100%); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Código do Agendamento</p>
                <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">${appointment.code}</p>
              </div>
              
              <!-- Details Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px 0 0 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Serviço</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${appointment.service?.name || "-"}</p>
                  </td>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 0 8px 0 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Duração</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${appointment.service?.duration_minutes || 50} minutos</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Data</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${formattedDate}</p>
                  </td>
                  <td style="padding: 12px; background-color: #f8fafc;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Horário</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${appointment.scheduled_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Modalidade</p>
                    <p style="margin: 4px 0 0;">
                      <span style="display: inline-block; background-color: ${modalityColor}; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${modalityText}
                      </span>
                    </p>
                  </td>
                </tr>
              </table>
              
              ${addressSection}
              
              <!-- Instructions -->
              <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 12px; font-weight: 600; color: #92400e;">⚠️ Instruções Importantes</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                  ${instructions}
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${confirmacaoLink}" style="display: inline-block; background: linear-gradient(135deg, #0d4a3a 0%, #1a6b52 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(13, 74, 58, 0.3);">
                      Ver Detalhes do Agendamento
                    </a>
                  </td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
              
              <!-- Contact -->
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                Precisa remarcar ou tem dúvidas? Entre em contato:
              </p>
              <p style="margin: 0;">
                <a href="https://wa.me/5551992809471" style="color: #0d4a3a; text-decoration: none; font-weight: 600;">📱 WhatsApp: (51) 99280-9471</a>
              </p>
              <p style="margin: 8px 0 0;">
                <a href="mailto:centropsicoavaliar@gmail.com" style="color: #0d4a3a; text-decoration: none; font-weight: 600;">✉️ E-mail: centropsicoavaliar@gmail.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0;">
                Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS
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
      to: recipientEmail,
      subject: `Ficha de Agendamento ${appointment.code} - Psicoavaliar`,
      content: `Olá ${recipientName}, segue os detalhes do seu agendamento: ${appointment.service?.name} em ${formattedDate} às ${appointment.scheduled_time.slice(0, 5)}. Código: ${appointment.code}. Acesse: ${confirmacaoLink}`,
      html: htmlContent,
    });

    await client.close();

    console.log("Appointment email sent successfully to:", recipientEmail);

    return new Response(
      JSON.stringify({ success: true, message: "E-mail enviado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending appointment email:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao enviar e-mail: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
