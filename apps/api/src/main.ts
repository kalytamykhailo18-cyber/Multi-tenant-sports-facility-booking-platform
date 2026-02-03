// NestJS Application Entry Point
// Bootstraps the application with global configuration

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3001;
  const frontendUrl = configService.get<string>('app.frontendUrl');
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const isDevelopment = configService.get<boolean>('app.isDevelopment');

  // Set global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: isDevelopment
      ? [frontendUrl!, 'http://localhost:3000', 'http://127.0.0.1:3000']
      : frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert query params to proper types
      },
      validationError: {
        target: false, // Don't include the target object in error
        value: false, // Don't include the value in error
      },
    }),
  );

  // Swagger documentation (development only)
  if (isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sports Booking SaaS API')
      .setDescription(
        'Multi-tenant sports facility booking platform API documentation',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Tenants', 'Tenant management (Super Admin)')
      .addTag('Facilities', 'Facility management')
      .addTag('Courts', 'Court management')
      .addTag('Bookings', 'Booking management')
      .addTag('Customers', 'Customer management')
      .addTag('Payments', 'Payment processing')
      .addTag('Subscriptions', 'Subscription management')
      .addTag('Dashboard', 'Dashboard statistics')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
  }

  // Start the application
  await app.listen(port);

  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`API prefix: /${apiPrefix}`);
  logger.log(`Environment: ${configService.get<string>('app.nodeEnv')}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
