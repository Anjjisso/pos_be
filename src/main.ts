import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

<<<<<<< HEAD
  const config = new DocumentBuilder()
    .setTitle('POS API')
    .setDescription('API docs for POS system')
    .setVersion('1.0')
    .addTag('auth')
    .build();

  const document = SwaggerModule.createDocument(app, config); // ✅ langsung createDocument
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
=======
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
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
}
bootstrap();
