import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Konfigurasi Swagger
  const config = new DocumentBuilder()
    .setTitle('POS API')
    .setDescription('API docs for POS system (Kasir, Admin, Superadmin)')
    .setVersion('1.0')
    .addTag('aplikasi-pos')
    // 🟢 Tambahkan JWT Auth di header
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Masukkan token JWT (format: Bearer <token>)',
        in: 'header',
      },
      'access-token', // nama skema
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // biar token gak hilang saat reload
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();