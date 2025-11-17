import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class KasirService {
  constructor(private prisma: PrismaService) {}

  // Kasir membuat order baru (pakai barcode)
async createOrder(dto: CreateOrderDto, userId: number) {
    const itemsData: { productId: number; quantity: number; subtotal: number }[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { barcode: item.barcode },
      });

      if (!product) throw new NotFoundException(`Produk dengan barcode ${item.barcode} tidak ditemukan`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stok produk ${product.name} tidak cukup`);
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        subtotal,
      });

      await this.prisma.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity },
      });
    }

    return this.prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        paymentMethod: dto.paymentMethod, // ✅ enum cast
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } } },
    });
  }

  // Kasir melihat histori order miliknya
async getKasirHistory(userId: number) {
  const orders = await this.prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      paymentMethod: true,
      items: {
        select: {
          quantity: true,
          product: { select: { price: true } }, // ❌ tanpa image
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((order, index) => {
    const totalItem = order.items.reduce((t, i) => t + i.quantity, 0);
    const totalPrice = order.items.reduce(
      (t, i) => t + i.quantity * (i.product?.price ?? 0),
      0,
    );

    // 🔢 Buat kode transaksi unik
    const created = new Date(order.createdAt);
    const trxCode = `TRX${created.getFullYear()}${String(
      created.getMonth() + 1,
    ).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}${String(
      order.id,
    ).padStart(4, '0')}`;

    return {
      no: index + 1,
      transactionId: trxCode,
      createdAt: order.createdAt,
      totalItem,
      totalPrice,
      paymentMethod: order.paymentMethod,
      actionId: order.id,
    };
  });
}
}
