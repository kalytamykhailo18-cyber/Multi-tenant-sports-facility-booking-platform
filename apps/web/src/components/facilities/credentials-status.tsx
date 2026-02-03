// Credentials Status Component
// Displays status of configured API credentials

'use client';

import type { CredentialsStatus } from '@/lib/facilities-api';

interface CredentialsStatusProps {
  credentials?: CredentialsStatus;
}

interface StatusIndicatorProps {
  label: string;
  configured: boolean;
}

function StatusIndicator({ label, configured }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          configured ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function CredentialsStatusDisplay({ credentials }: CredentialsStatusProps) {
  if (!credentials) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <StatusIndicator label="WhatsApp" configured={credentials.whatsapp} />
      <StatusIndicator label="Mercado Pago" configured={credentials.mercadoPago} />
      <StatusIndicator label="Gemini AI" configured={credentials.gemini} />
      <StatusIndicator label="Whisper" configured={credentials.whisper} />
    </div>
  );
}
