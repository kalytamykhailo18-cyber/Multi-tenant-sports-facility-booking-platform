// Landing Page - Public Marketing Website
// Introduces the platform to potential facility owners

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FiMessageSquare,
  FiCalendar,
  FiCreditCard,
  FiUsers,
  FiTarget,
  FiTrendingUp,
  FiClock,
  FiShield,
  FiZap,
  FiStar,
  FiCheck,
  FiArrowRight,
} from 'react-icons/fi';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 animate-fade-down-fast">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Sports Booking</h1>
          </div>
          <Button onClick={() => router.push('/login')} variant="outline" className="rounded-md">
            Ingresar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-up-normal">
            Automatiza las Reservas de tu Complejo
            <br />
            <span className="text-primary">con WhatsApp e IA</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-up-slow">
            Plataforma SaaS completa para gestión de canchas de fútbol, pádel y tenis.
            Bot inteligente que atiende a tus clientes 24/7 por WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-up-light-slow">
            <Button size="lg" onClick={() => router.push('/login')} className="rounded-md">
              Comenzar Ahora
              <FiArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-md"
            >
              Ver Características
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-zoom-in-slow">
            <div>
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-gray-600">Atención Automática</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-gray-600">En Argentina</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">5min</p>
              <p className="text-sm text-gray-600">Tiempo de Setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-white">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-down-fast">
            Todo lo que Necesitas en un Solo Lugar
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-down-normal">
            Sistema completo de gestión con tecnología de punta
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="hover:shadow-lg transition-shadow animate-fade-up-fast">
            <CardHeader>
              <div className="mb-4"><FiMessageSquare className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Bot de WhatsApp con IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Reservas automáticas 24/7 a través de WhatsApp. Tu bot responde como un humano usando Gemini AI.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="hover:shadow-lg transition-shadow animate-fade-down-normal">
            <CardHeader>
              <div className="mb-4"><FiCalendar className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Calendario en Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Gestiona todas tus canchas desde un calendario inteligente. Sincronización instantánea.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="hover:shadow-lg transition-shadow animate-fade-left-slow">
            <CardHeader>
              <div className="mb-4"><FiCreditCard className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Pagos con Mercado Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Cobra señas automáticamente. Integración en un clic con Mercado Pago OAuth.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="hover:shadow-lg transition-shadow animate-fade-right-light-slow">
            <CardHeader>
              <div className="mb-4"><FiUsers className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Gestión de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Perfiles automáticos, historial de reservas, sistema de reputación y créditos.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="hover:shadow-lg transition-shadow animate-zoom-in-fast">
            <CardHeader>
              <div className="mb-4"><FiTarget className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Buscar Rival</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Tus clientes pueden encontrar compañeros para completar equipos.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="hover:shadow-lg transition-shadow animate-flip-up-normal">
            <CardHeader>
              <div className="mb-4"><FiTrendingUp className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-xl">Reportes Financieros</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Análisis completo de ingresos, flujo de caja, deudas y proyecciones.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-up-fast">
            ¿Por Qué Sports Booking?
          </h3>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center animate-fade-left-normal">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Ahorra Tiempo</h4>
              <p className="text-gray-600">El bot atiende reservas mientras duermes</p>
            </div>

            <div className="text-center animate-fade-up-normal">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiZap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Aumenta Reservas</h4>
              <p className="text-gray-600">Disponibilidad 24/7 = más ingresos</p>
            </div>

            <div className="text-center animate-fade-right-normal">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Reduce No-Shows</h4>
              <p className="text-gray-600">Sistema de señas y confirmaciones</p>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 animate-fade-up-slow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <FiStar className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">
                    Diseñado para Argentina
                  </h4>
                  <p className="text-gray-700">
                    Entendemos tus necesidades: señas, mensajes de confirmación, lista de espera,
                    sistema de reputación y más.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-3xl mx-auto text-center animate-fade-up-normal">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para Automatizar tu Complejo?
          </h3>
          <p className="text-xl text-gray-700 mb-8">
            Únete a los complejos deportivos que ya están ahorrando tiempo y aumentando ingresos.
          </p>
          <Button size="lg" onClick={() => router.push('/login')} className="rounded-md">
            Comenzar Ahora
            <FiArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-lg">Sports Booking</h4>
              </div>
              <p className="text-gray-600 text-sm">
                Plataforma SaaS para gestión de canchas deportivas en Argentina.
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Producto</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Características</li>
                <li>Precios</li>
                <li>Documentación</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Empresa</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Sobre Nosotros</li>
                <li>Contacto</li>
                <li>Términos y Condiciones</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Soporte</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Centro de Ayuda</li>
                <li>soporte@sportsbooking.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 Sports Booking SaaS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
