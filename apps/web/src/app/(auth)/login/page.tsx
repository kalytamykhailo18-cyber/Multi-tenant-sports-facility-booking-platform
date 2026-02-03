// Login Page
// Handles user authentication with email/password

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError, checkAuth } = useAuth();

  // Local form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle form submission
  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // Redirect happens in the effect above when isAuthenticated changes
    } catch {
      // Error is handled by the store and displayed via the error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && !isLoading) {
      handleSubmit();
    }
  };

  // Show loading while checking auth
  if (isLoading && !isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sports Booking
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
        </div>

        {/* Submit button */}
        <Button
          type="button"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !email || !password}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
