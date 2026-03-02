import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "qrcode";

interface AppointmentData {
  code: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  modality: "presencial" | "online";
  reason_for_visit?: string | null;
  online_meeting_link?: string | null;
  video_link?: string | null;
  service?: {
    name: string;
    duration_minutes: number;
  };
  client?: {
    full_name: string;
    email: string;
    phone: string;
    birth_date?: string | null;
  };
}

// Premium color palette
const colors = {
  primary: [34, 87, 71] as [number, number, number], // #225747 - Verde escuro
  primaryLight: [76, 141, 121] as [number, number, number], // Verde claro
  accent: [245, 158, 11] as [number, number, number], // Dourado
  accentDark: [180, 83, 9] as [number, number, number], // Dourado escuro
  dark: [30, 41, 59] as [number, number, number], // Cinza escuro
  muted: [100, 116, 139] as [number, number, number], // Cinza médio
  light: [241, 245, 249] as [number, number, number], // Cinza claro
  white: [255, 255, 255] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number], // Azul para online
  blueDark: [29, 78, 216] as [number, number, number],
  yellow: [254, 243, 199] as [number, number, number],
  yellowBorder: [217, 119, 6] as [number, number, number],
};

const SITE_URL = "https://avaliar.packmasterlegacy.net";

export async function generateAppointmentPDF(appointment: AppointmentData): Promise<void> {
  const isOnline = appointment.modality === "online";
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Color scheme based on modality
  const themeColor = isOnline ? colors.blue : colors.primary;
  const themeColorLight = isOnline ? colors.blueDark : colors.primaryLight;

  // ============ HEADER WITH GRADIENT EFFECT ============
  for (let i = 0; i < 45; i++) {
    const ratio = i / 45;
    const r = themeColor[0] + (themeColorLight[0] - themeColor[0]) * ratio;
    const g = themeColor[1] + (themeColorLight[1] - themeColor[1]) * ratio;
    const b = themeColor[2] + (themeColorLight[2] - themeColor[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(0, i * 1.2, pageWidth, 1.5, "F");
  }

  y = 8;

  // Load and add logo
  try {
    const logoImg = await loadImage("/logo-psicoavaliar-ficha.webp");
    doc.addImage(logoImg, "WEBP", margin, y, 35, 35);
  } catch (error) {
    console.error("Error loading logo:", error);
    // Fallback: draw circle with text
    doc.setFillColor(...colors.white);
    doc.circle(margin + 17.5, y + 17.5, 17, "F");
    doc.setTextColor(...themeColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PA", margin + 17.5, y + 20, { align: "center" });
  }

  // Title on right side
  doc.setTextColor(...colors.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PSICOAVALIAR", margin + 45, y + 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Centro de Psicologia", margin + 45, y + 19);

  // Document type
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const documentTitle = isOnline ? "FICHA DE CONSULTA ONLINE" : "FICHA DE COMPARECIMENTO";
  doc.text(documentTitle, pageWidth - margin, y + 15, { align: "right" });

  // Accent line
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(1);
  doc.line(margin + 45, y + 23, margin + 100, y + 23);

  y = 55;

  // ============ QR CODE + APPOINTMENT CODE SECTION ============
  const qrSize = 28;
  const codeBoxWidth = 75;
  const totalWidth = qrSize + 12 + codeBoxWidth;
  const startX = (pageWidth - totalWidth) / 2;

  // Generate QR Code - points to check-in page
  try {
    const checkInUrl = `${SITE_URL}/checkin/${appointment.code}`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: isOnline ? "#1d4ed8" : "#225747",
        light: "#ffffff"
      }
    });
    doc.addImage(qrDataUrl, "PNG", startX, y, qrSize, qrSize);
  } catch (error) {
    console.error("Error generating QR code:", error);
    doc.setFillColor(...colors.light);
    doc.roundedRect(startX, y, qrSize, qrSize, 3, 3, "F");
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.text("QR Code", startX + qrSize / 2, y + 15, { align: "center" });
  }

  // Code box
  const codeBoxX = startX + qrSize + 12;
  const codeBoxHeight = 24;

  // Shadow
  doc.setFillColor(180, 180, 180);
  doc.roundedRect(codeBoxX + 1, y + 2, codeBoxWidth, codeBoxHeight, 4, 4, "F");
  
  // Main box
  doc.setFillColor(...themeColor);
  doc.roundedRect(codeBoxX, y, codeBoxWidth, codeBoxHeight, 4, 4, "F");
  
  // Accent top bar
  doc.setFillColor(...colors.accent);
  doc.rect(codeBoxX, y, codeBoxWidth, 4, "F");
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CODIGO DO AGENDAMENTO", codeBoxX + codeBoxWidth / 2, y + 11, { align: "center" });
  
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(appointment.code, codeBoxX + codeBoxWidth / 2, y + 20, { align: "center" });

  // QR Code label
  doc.setTextColor(...colors.muted);
  doc.setFontSize(6);
  doc.text("Escaneie para check-in", startX + qrSize / 2, y + qrSize + 4, { align: "center" });

  y += 38;

  // ============ CLIENT INFORMATION SECTION ============
  drawSectionHeader(doc, "DADOS DO PACIENTE", margin, y, contentWidth, themeColor);
  y += 11;

  doc.setFillColor(...colors.light);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "F");
  
  const clientY = y + 7;
  const col2X = margin + contentWidth / 2;
  
  drawLabelValue(doc, "Nome Completo", appointment.client?.full_name || "-", margin + 6, clientY);
  drawLabelValue(doc, "E-mail", appointment.client?.email || "-", margin + 6, clientY + 11);
  drawLabelValue(doc, "Telefone", formatPhone(appointment.client?.phone || "-"), margin + 6, clientY + 22);
  
  if (appointment.client?.birth_date) {
    const birthDate = format(parseISO(appointment.client.birth_date), "dd/MM/yyyy");
    drawLabelValue(doc, "Data de Nascimento", birthDate, col2X, clientY + 22);
  }

  y += 45;

  // ============ APPOINTMENT INFORMATION SECTION ============
  drawSectionHeader(doc, "DADOS DA CONSULTA", margin, y, contentWidth, themeColor);
  y += 11;

  doc.setFillColor(...colors.light);
  doc.roundedRect(margin, y, contentWidth, 48, 3, 3, "F");

  const appointmentY = y + 7;

  // Row 1: Service and Duration
  drawLabelValue(doc, "Servico", appointment.service?.name || "-", margin + 6, appointmentY);
  drawLabelValue(doc, "Duracao", `${appointment.service?.duration_minutes || 50} minutos`, col2X, appointmentY);

  // Row 2: Date and Time
  const formattedDate = format(parseISO(appointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedWeekday = format(parseISO(appointment.scheduled_date), "EEEE", { locale: ptBR });
  const capitalizedWeekday = formattedWeekday.charAt(0).toUpperCase() + formattedWeekday.slice(1);
  
  drawLabelValue(doc, "Data", `${capitalizedWeekday}, ${formattedDate}`, margin + 6, appointmentY + 13);
  drawLabelValue(doc, "Horario", `${appointment.scheduled_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}`, col2X, appointmentY + 13);

  // Row 3: Modality badge
  doc.setFontSize(7);
  doc.setTextColor(...colors.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Modalidade", margin + 6, appointmentY + 26);
  
  const modalityText = isOnline ? "ONLINE" : "PRESENCIAL";
  
  doc.setFillColor(...themeColor);
  doc.roundedRect(margin + 6, appointmentY + 28, 28, 7, 2, 2, "F");
  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(modalityText, margin + 20, appointmentY + 33, { align: "center" });

  y += 55;

  // ============ CLINIC/ONLINE INFO SECTION ============
  if (isOnline) {
    drawSectionHeader(doc, "INSTRUCOES PARA CONSULTA ONLINE", margin, y, contentWidth, themeColor);
    y += 11;

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, contentWidth, 45, 3, 3, "F");
    doc.setDrawColor(...colors.blue);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 45, 3, 3, "S");

    const onlineY = y + 8;

    doc.setTextColor(...colors.blueDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Prepare-se para sua consulta:", margin + 6, onlineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.dark);
    const onlineInstructions = [
      "O link sera enviado por e-mail e estara disponivel no seu painel do cliente",
      "Acesse um ambiente tranquilo, silencioso e com boa iluminacao",
      "Verifique sua conexao de internet, camera e microfone antes",
      "Acesse o link com 5 minutos de antecedencia",
      "Use fones de ouvido para maior privacidade"
    ];
    
    onlineInstructions.forEach((instruction, index) => {
      doc.text(`- ${instruction}`, margin + 6, onlineY + 7 + (index * 5));
    });

    y += 50;

    // Technical requirements
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");

    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("Requisitos Tecnicos:", margin + 6, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.dark);
    doc.text("Navegador atualizado (Chrome, Firefox, Safari ou Edge)", margin + 6, y + 11);
    doc.text("Webcam e microfone funcionando | Conexao de internet estavel (minimo 5 Mbps)", margin + 6, y + 15);

    y += 23;

  } else {
    drawSectionHeader(doc, "INFORMACOES DA CLINICA", margin, y, contentWidth, themeColor);
    y += 11;

    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, "F");

    const clinicY = y + 8;

    // Address
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Endereco", margin + 6, clinicY);
    doc.setTextColor(...colors.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Rua Joao Salomoni, 650 - Vila Nova", margin + 6, clinicY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Porto Alegre - RS, CEP 91740-830", margin + 6, clinicY + 10);

    // Contact
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.text("Contato", col2X, clinicY);
    doc.setTextColor(...colors.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("(51) 99280-9471", col2X, clinicY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("centropsicoavaliar@gmail.com", col2X, clinicY + 10);

    // Hours
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.text("Horario de Funcionamento", margin + 6, clinicY + 20);
    doc.setTextColor(...colors.dark);
    doc.setFontSize(9);
    doc.text("Segunda a Sexta: 08h as 19h | Sabado: 08h as 12h", margin + 6, clinicY + 25);

    y += 45;
  }

  // ============ INSTRUCTIONS BOX ============
  doc.setFillColor(...colors.yellow);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");
  doc.setDrawColor(...colors.yellowBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("INSTRUCOES IMPORTANTES", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  
  const instructions = isOnline
    ? [
        "Teste sua conexao, camera e microfone antes da consulta.",
        "Esteja em um local privado e sem interrupcoes.",
        "Tenha agua por perto e desligue notificacoes do celular.",
        "Em caso de problemas tecnicos, ligue: (51) 99280-9471"
      ]
    : [
        "Chegue com 10 minutos de antecedencia para o cadastro na recepcao.",
        "Apresente esta ficha e um documento de identificacao com foto.",
        "Traga exames, laudos ou relatorios anteriores, se houver.",
        "Em caso de cancelamento, avise com pelo menos 24 horas de antecedencia."
      ];
  
  instructions.forEach((instruction, index) => {
    doc.text(`- ${instruction}`, margin + 6, y + 13 + (index * 5));
  });

  y += 38;

  // ============ SIGNATURE AREA (only for presencial) ============
  if (!isOnline) {
    const sigWidth = (contentWidth - 15) / 2;
    
    doc.setDrawColor(...colors.muted);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 12, margin + sigWidth, y + 12);
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.text("Assinatura da Recepcao", margin + sigWidth / 2, y + 17, { align: "center" });

    doc.line(margin + sigWidth + 15, y + 12, margin + contentWidth, y + 12);
    doc.text("Data e Hora de Chegada", margin + sigWidth + 15 + sigWidth / 2, y + 17, { align: "center" });
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 15;
  
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy")} as ${format(new Date(), "HH:mm")} | psicoavaliar.com.br`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.setFontSize(6);
  doc.text(`Consulte seu agendamento: ${SITE_URL}/consulta/${appointment.code}`, pageWidth / 2, footerY + 4, { align: "center" });

  // ============ SAVE PDF ============
  const fileName = isOnline 
    ? `Ficha-Consulta-Online-${appointment.code}.pdf`
    : `Ficha-Comparecimento-${appointment.code}.pdf`;
  doc.save(fileName);
}

// Helper function to draw section headers
function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number, width: number, color: [number, number, number] = colors.primary) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, 8, 2, 2, "F");
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + 5, y + 5.5);
}

// Helper function to draw label-value pairs
function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);
  
  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(value, x, y + 4);
}

// Helper function to format phone number
function formatPhone(phone: string): string {
  if (!phone || phone === "-") return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Helper function to load image as base64
function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}
