// QR Code Display Component
// Displays and allows downloading QR code for facility WhatsApp

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { QrCodeResponse, GenerateQrCodeRequest } from '@/lib/facilities-api';

interface QrCodeDisplayProps {
  facilityId: string;
  facilityName: string;
  whatsappPhone?: string | null;
  qrCode: QrCodeResponse | null;
  isGenerating: boolean;
  onGenerate: (options?: GenerateQrCodeRequest) => Promise<void>;
}

export function QrCodeDisplay({
  facilityId,
  facilityName,
  whatsappPhone,
  qrCode,
  isGenerating,
  onGenerate,
}: QrCodeDisplayProps) {
  const [customMessage, setCustomMessage] = useState('Hola, quiero hacer una reserva');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      await onGenerate({
        message: customMessage,
        size: 400,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar código QR');
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;

    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = qrCode.qrCode;
    link.download = `qr-${facilityName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!qrCode) return;

    navigator.clipboard.writeText(qrCode.whatsappLink).then(() => {
      // Could show a toast here
      alert('Link copiado al portapapeles');
    });
  };

  const handlePrint = () => {
    if (!qrCode) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código QR - ${facilityName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            img {
              width: 300px;
              height: 300px;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <h1>${facilityName}</h1>
          <p>Escaneá el código para reservar por WhatsApp</p>
          <img src="${qrCode.qrCode}" alt="QR Code" />
          <p class="footer">${qrCode.whatsappPhone || ''}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!whatsappPhone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Código QR de WhatsApp</CardTitle>
          <CardDescription>
            Genera un código QR para que tus clientes reserven fácilmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No hay un número de WhatsApp configurado para esta instalación.
            </p>
            <p className="text-sm text-muted-foreground">
              Configura un número de WhatsApp en la sección de configuración para generar códigos QR.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código QR de WhatsApp</CardTitle>
        <CardDescription>
          Genera un código QR para que tus clientes reserven fácilmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom message input */}
        <div className="space-y-2">
          <Label htmlFor="customMessage">Mensaje de Saludo</Label>
          <Input
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Hola, quiero hacer una reserva"
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">
            Este mensaje aparecerá pre-cargado cuando el cliente escanee el QR
          </p>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Generando...
            </>
          ) : qrCode ? (
            'Regenerar Código QR'
          ) : (
            'Generar Código QR'
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* QR Code Display */}
        {qrCode && (
          <div className="space-y-4">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg border">
              <img
                src={qrCode.qrCode}
                alt={`QR Code for ${facilityName}`}
                className="w-64 h-64"
              />
              <p className="mt-4 text-lg font-semibold text-center">{qrCode.facilityName}</p>
              {qrCode.whatsappPhone && (
                <p className="text-sm text-muted-foreground">{qrCode.whatsappPhone}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={handleDownload}>
                Descargar
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                Copiar Link
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                Imprimir
              </Button>
            </div>

            {/* WhatsApp link */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Link de WhatsApp:</p>
              <p className="text-sm break-all">{qrCode.whatsappLink}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
