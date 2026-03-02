// Payment system types

export type PriceMode = 'fixed' | 'from' | 'consult';
export type PaymentType = 'full' | 'deposit' | 'none';
export type OrderStatus = 'draft' | 'pending' | 'paid' | 'refunded' | 'canceled' | 'expired';
export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled' | 'expired';
export type PaymentMethod = 'pix' | 'card' | 'boleto' | 'manual';
export type PaymentProvider = 'mercadopago' | 'appmax' | 'stripe' | 'pagarme' | 'manual';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ServicePricing {
  price_mode: PriceMode;
  price: number | null;
  price_from_amount: number | null;
  currency: string;
  allow_installments: boolean;
  max_installments: number;
  require_payment_to_confirm: boolean;
  payment_type: PaymentType;
  deposit_amount: number | null;
  show_price_publicly: boolean;
}

export interface Order {
  id: string;
  code: string;
  client_id: string | null;
  appointment_id: string | null;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_required: boolean;
  payment_type: 'full' | 'deposit';
  deposit_amount: number | null;
  balance_due: number;
  provider_selected: string | null;
  notes: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  client?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  appointment?: {
    id: string;
    code: string;
    scheduled_date: string;
    scheduled_time: string;
  };
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  payable_type: 'appointment' | 'service_fee' | 'plan_subscription';
  payable_id: string | null;
  description: string;
  unit_amount: number;
  quantity: number;
  total_amount: number;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  method: PaymentMethod | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payment_url: string | null;
  pix_qr_base64: string | null;
  pix_copy_paste: string | null;
  boleto_url: string | null;
  boleto_barcode: string | null;
  installments: number;
  expires_at: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  raw_provider_response_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefund {
  id: string;
  payment_id: string;
  amount: number;
  status: RefundStatus;
  reason: string | null;
  provider_refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProviderConfig {
  id: string;
  provider: PaymentProvider;
  is_active: boolean;
  environment: 'sandbox' | 'production';
  credentials_encrypted_json: Record<string, string> | null;
  settings_json: {
    name?: string;
    supports?: PaymentMethod[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface PaymentSettings {
  enabled_methods: {
    pix: boolean;
    card: boolean;
    boleto: boolean;
  };
  checkout_text: {
    title: string;
    description: string;
  };
  cancellation_policy: {
    text: string;
  };
  installments: {
    enabled: boolean;
    max: number;
    min_amount: number;
  };
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  provider_event_id: string | null;
  signature_valid: boolean | null;
  payload_json: Record<string, unknown>;
  processed_at: string | null;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored';
  error: string | null;
  created_at: string;
}

export interface CheckoutData {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  priceMode: PriceMode;
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  modality?: 'presencial' | 'online';
  professionalName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCpf?: string;
}

// Helper functions
export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPriceDisplay(
  priceMode: PriceMode,
  price: number | null,
  priceFromAmount: number | null,
  showPublicly: boolean
): string {
  if (!showPublicly || priceMode === 'consult') {
    return 'Valor sob consulta';
  }
  
  if (priceMode === 'from' && priceFromAmount !== null) {
    return `A partir de ${formatCurrency(priceFromAmount)}`;
  }
  
  if (priceMode === 'fixed' && price !== null) {
    return formatCurrency(price);
  }
  
  return 'Valor sob consulta';
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    draft: 'Rascunho',
    pending: 'Pendente',
    paid: 'Pago',
    refunded: 'Reembolsado',
    canceled: 'Cancelado',
    expired: 'Expirado',
  };
  return labels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    created: 'Criado',
    pending: 'Pendente',
    paid: 'Pago',
    failed: 'Falhou',
    refunded: 'Reembolsado',
    canceled: 'Cancelado',
    expired: 'Expirado',
  };
  return labels[status];
}

export function getPaymentMethodLabel(method: PaymentMethod | null): string {
  if (!method) return '-';
  const labels: Record<PaymentMethod, string> = {
    pix: 'Pix',
    card: 'Cartão',
    boleto: 'Boleto',
    manual: 'Manual',
  };
  return labels[method];
}
