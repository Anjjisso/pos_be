import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class KasirService {
  constructor(private prisma: PrismaService) {}

  // Kasir membuat order baru
  async createOrder(dto: CreateOrderDto, userId: number) {
    const itemsData: { productId: number; quantity: number; subtotal: number }[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new NotFoundException(`Produk dengan ID ${item.productId} tidak ditemukan`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stok produk ${product.name} tidak cukup`);
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        subtotal,
      });

      // kurangi stok
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity },
      });
    }

    // buat order baru
    return this.prisma.order.create({
      data: {
        userId,
        total,
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } } },
    });
  }

  // Kasir melihat histori order miliknya sendiri
  async getKasirHistory(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
