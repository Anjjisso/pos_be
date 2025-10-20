import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
<<<<<<< HEAD

@Module({
  imports: [AuthModule, UserModule, PrismaModule],
=======
import { MailerModule } from '@nestjs-modules/mailer';
import { ProductsModule } from './products/products.module';
import { PelangganModule } from './pelanggan/pelanggan.module';
import { AdminModule } from './admin/admin.module';
import { KasirModule } from './kasir/kasir.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"POS App" <no-reply@posapp.com>',
      },
    }),
    ProductsModule,
    PelangganModule,
    AdminModule,
    KasirModule,
  ],

>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
})
export class AppModule {}
