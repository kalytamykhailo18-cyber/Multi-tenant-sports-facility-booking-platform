// Credentials Form Component
// Form for managing facility API credentials

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type {
  Facility,
  WhatsAppCredentials,
  MercadoPagoCredentials,
  GeminiCredentials,
  WhisperCredentials,
  CredentialType,
  TestCredentialsResult,
} from '@/lib/facilities-api';

interface CredentialsFormProps {
  facility: Facility;
  onUpdateWhatsApp: (credentials: WhatsAppCredentials) => Promise<void>;
  onUpdateMercadoPago: (credentials: MercadoPagoCredentials) => Promise<void>;
  onUpdateGemini: (credentials: GeminiCredentials) => Promise<void>;
  onUpdateWhisper: (credentials: WhisperCredentials) => Promise<void>;
  onTestCredentials: (type: CredentialType) => Promise<TestCredentialsResult>;
  isUpdating?: boolean;
  isTesting?: boolean;
}

interface CredentialSectionProps {
  title: string;
  description: string;
  isConfigured: boolean;
  children: React.ReactNode;
  onSave: () => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
  testResult?: TestCredentialsResult | null;
}

function CredentialSection({
  title,
  description,
  isConfigured,
  children,
  onSave,
  onTest,
  isSaving,
  isTesting,
  testResult,
}: CredentialSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={!isConfigured || isTesting}
            >
              {isTesting ? (
                <>
                  <Spinner size="sm" className="mr-1" />
                  Probando...
                </>
              ) : (
                'Probar'
              )}
            </Button>
          </div>
        </div>
        {testResult && (
          <div
            className={`mt-2 p-2 rounded-md text-sm ${
              testResult.success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar Credenciales'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CredentialsForm({
  facility,
  onUpdateWhatsApp,
  onUpdateMercadoPago,
  onUpdateGemini,
  onUpdateWhisper,
  onTestCredentials,
  isUpdating = false,
  isTesting = false,
}: CredentialsFormProps) {
  // WhatsApp credentials state
  const [waApiKey, setWaApiKey] = useState('');
  const [waApiSecret, setWaApiSecret] = useState('');
  const [waWebhookToken, setWaWebhookToken] = useState('');
  const [waTestResult, setWaTestResult] = useState<TestCredentialsResult | null>(null);

  // MercadoPago credentials state
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpTestResult, setMpTestResult] = useState<TestCredentialsResult | null>(null);

  // Gemini credentials state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiTestResult, setGeminiTestResult] = useState<TestCredentialsResult | null>(null);

  // Whisper credentials state
  const [whisperApiKey, setWhisperApiKey] = useState('');
  const [whisperTestResult, setWhisperTestResult] = useState<TestCredentialsResult | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Which credential type is currently being saved/tested
  const [savingType, setSavingType] = useState<CredentialType | null>(null);
  const [testingType, setTestingType] = useState<CredentialType | null>(null);

  // Handlers
  const handleSaveWhatsApp = async () => {
    if (!waApiKey.trim() || !waApiSecret.trim()) {
      setError('API Key y API Secret son requeridos');
      return;
    }
    setError(null);
    setSavingType('whatsapp');
    try {
      await onUpdateWhatsApp({
        apiKey: waApiKey.trim(),
        apiSecret: waApiSecret.trim(),
        webhookToken: waWebhookToken.trim() || undefined,
      });
      // Clear fields after successful save (they're now stored encrypted)
      setWaApiKey('');
      setWaApiSecret('');
      setWaWebhookToken('');
      setWaTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales');
    } finally {
      setSavingType(null);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingType('whatsapp');
    try {
      const result = await onTestCredentials('whatsapp');
      setWaTestResult(result);
    } catch (err) {
      setWaTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar credenciales',
      });
    } finally {
      setTestingType(null);
    }
  };

  const handleSaveMercadoPago = async () => {
    if (!mpAccessToken.trim() || !mpPublicKey.trim()) {
      setError('Access Token y Public Key son requeridos');
      return;
    }
    setError(null);
    setSavingType('mercadopago');
    try {
      await onUpdateMercadoPago({
        accessToken: mpAccessToken.trim(),
        publicKey: mpPublicKey.trim(),
      });
      setMpAccessToken('');
      setMpPublicKey('');
      setMpTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales');
    } finally {
      setSavingType(null);
    }
  };

  const handleTestMercadoPago = async () => {
    setTestingType('mercadopago');
    try {
      const result = await onTestCredentials('mercadopago');
      setMpTestResult(result);
    } catch (err) {
      setMpTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar credenciales',
      });
    } finally {
      setTestingType(null);
    }
  };

  const handleSaveGemini = async () => {
    if (!geminiApiKey.trim()) {
      setError('API Key es requerida');
      return;
    }
    setError(null);
    setSavingType('gemini');
    try {
      await onUpdateGemini({
        apiKey: geminiApiKey.trim(),
      });
      setGeminiApiKey('');
      setGeminiTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales');
    } finally {
      setSavingType(null);
    }
  };

  const handleTestGemini = async () => {
    setTestingType('gemini');
    try {
      const result = await onTestCredentials('gemini');
      setGeminiTestResult(result);
    } catch (err) {
      setGeminiTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar credenciales',
      });
    } finally {
      setTestingType(null);
    }
  };

  const handleSaveWhisper = async () => {
    if (!whisperApiKey.trim()) {
      setError('API Key es requerida');
      return;
    }
    setError(null);
    setSavingType('whisper');
    try {
      await onUpdateWhisper({
        apiKey: whisperApiKey.trim(),
      });
      setWhisperApiKey('');
      setWhisperTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales');
    } finally {
      setSavingType(null);
    }
  };

  const handleTestWhisper = async () => {
    setTestingType('whisper');
    try {
      const result = await onTestCredentials('whisper');
      setWhisperTestResult(result);
    } catch (err) {
      setWhisperTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar credenciales',
      });
    } finally {
      setTestingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* WhatsApp Credentials */}
      <CredentialSection
        title="WhatsApp Business API"
        description="Credenciales de Meta para el bot de WhatsApp"
        isConfigured={facility.credentials?.whatsapp || false}
        onSave={handleSaveWhatsApp}
        onTest={handleTestWhatsApp}
        isSaving={savingType === 'whatsapp'}
        isTesting={testingType === 'whatsapp'}
        testResult={waTestResult}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waApiKey">API Key (Access Token)</Label>
            <Input
              id="waApiKey"
              type="password"
              value={waApiKey}
              onChange={(e) => setWaApiKey(e.target.value)}
              placeholder={facility.credentials?.whatsapp ? '••••••••••••' : 'Ingresa el Access Token'}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waApiSecret">API Secret (App Secret)</Label>
            <Input
              id="waApiSecret"
              type="password"
              value={waApiSecret}
              onChange={(e) => setWaApiSecret(e.target.value)}
              placeholder={facility.credentials?.whatsapp ? '••••••••••••' : 'Ingresa el App Secret'}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waWebhookToken">Webhook Verify Token (Opcional)</Label>
            <Input
              id="waWebhookToken"
              type="password"
              value={waWebhookToken}
              onChange={(e) => setWaWebhookToken(e.target.value)}
              placeholder="Token de verificación del webhook"
              disabled={isUpdating}
            />
          </div>
        </div>
      </CredentialSection>

      {/* MercadoPago Credentials */}
      <CredentialSection
        title="Mercado Pago"
        description="Credenciales para procesar pagos"
        isConfigured={facility.credentials?.mercadoPago || false}
        onSave={handleSaveMercadoPago}
        onTest={handleTestMercadoPago}
        isSaving={savingType === 'mercadopago'}
        isTesting={testingType === 'mercadopago'}
        testResult={mpTestResult}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mpAccessToken">Access Token</Label>
            <Input
              id="mpAccessToken"
              type="password"
              value={mpAccessToken}
              onChange={(e) => setMpAccessToken(e.target.value)}
              placeholder={facility.credentials?.mercadoPago ? '••••••••••••' : 'Ingresa el Access Token'}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground">
              Encontralo en Mercado Pago → Credenciales → Access Token
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mpPublicKey">Public Key</Label>
            <Input
              id="mpPublicKey"
              type="password"
              value={mpPublicKey}
              onChange={(e) => setMpPublicKey(e.target.value)}
              placeholder={facility.credentials?.mercadoPago ? '••••••••••••' : 'Ingresa la Public Key'}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CredentialSection>

      {/* Gemini AI Credentials */}
      <CredentialSection
        title="Gemini AI"
        description="API key para el motor de inteligencia artificial"
        isConfigured={facility.credentials?.gemini || false}
        onSave={handleSaveGemini}
        onTest={handleTestGemini}
        isSaving={savingType === 'gemini'}
        isTesting={testingType === 'gemini'}
        testResult={geminiTestResult}
      >
        <div className="space-y-2">
          <Label htmlFor="geminiApiKey">API Key</Label>
          <Input
            id="geminiApiKey"
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder={facility.credentials?.gemini ? '••••••••••••' : 'Ingresa la API Key de Gemini'}
            disabled={isUpdating}
          />
          <p className="text-xs text-muted-foreground">
            Obtenela en Google AI Studio → API Keys
          </p>
        </div>
      </CredentialSection>

      {/* Whisper Credentials */}
      <CredentialSection
        title="Whisper (OpenAI)"
        description="API key para transcripción de audio"
        isConfigured={facility.credentials?.whisper || false}
        onSave={handleSaveWhisper}
        onTest={handleTestWhisper}
        isSaving={savingType === 'whisper'}
        isTesting={testingType === 'whisper'}
        testResult={whisperTestResult}
      >
        <div className="space-y-2">
          <Label htmlFor="whisperApiKey">API Key</Label>
          <Input
            id="whisperApiKey"
            type="password"
            value={whisperApiKey}
            onChange={(e) => setWhisperApiKey(e.target.value)}
            placeholder={facility.credentials?.whisper ? '••••••••••••' : 'Ingresa la API Key de OpenAI'}
            disabled={isUpdating}
          />
          <p className="text-xs text-muted-foreground">
            Obtenela en OpenAI Platform → API Keys
          </p>
        </div>
      </CredentialSection>
    </div>
  );
}
