// Landing Page - Public landing page
// Full implementation in Phase 13

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Sports Booking</h1>
        <Button onClick={() => router.push('/login')}>
          Ingresar
        </Button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Reservas de Canchas
          <br />
          <span className="text-primary">Simple y Automatizado</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Plataforma SaaS multi-tenant para gestión de canchas de fútbol, pádel y tenis.
          Bot de WhatsApp con IA para reservas automáticas.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => router.push('/login')}>
            Comenzar Ahora
          </Button>
        </div>
      </main>

      {/* Features Section (Placeholder) */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Características</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h4 className="text-xl font-semibold mb-2">Bot de WhatsApp</h4>
            <p className="text-gray-600">
              Reservas automáticas via chat con IA integrada.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h4 className="text-xl font-semibold mb-2">Calendario en Tiempo Real</h4>
            <p className="text-gray-600">
              Visualiza y gestiona reservas al instante.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h4 className="text-xl font-semibold mb-2">Pagos con Mercado Pago</h4>
            <p className="text-gray-600">
              Cobro de señas y pagos integrados.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 border-t text-center text-gray-600">
        <p>Sports Booking SaaS - Plataforma de reservas</p>
      </footer>
    </div>
  );
}
