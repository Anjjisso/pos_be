import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================================
  // 🟢 FIX CORS 100% untuk Vite + Axios (Wajib)
  // ============================================================
  app.enableCors({
    origin: "http://localhost:5173", // TANPA SLASH!
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization",
  });

  // ============================================================
  // 🟢 SWAGGER CONFIG
  // ============================================================
  const config = new DocumentBuilder()
    .setTitle('POS API')
    .setDescription('API docs for POS system (Kasir, Admin, Superadmin)')
    .setVersion('1.0')
    .addTag('aplikasi-pos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Masukkan token JWT (format: Bearer <token>)',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
