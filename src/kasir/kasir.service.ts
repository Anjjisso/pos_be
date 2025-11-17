import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class KasirService {
  constructor(private prisma: PrismaService) {}

  // ======================
  // ✔ CREATE ORDER
  // ======================
  async createOrder(dto: CreateOrderDto, userId: number) {
  let total = 0;

  const itemsData: any[] = []; // FIXED

  for (const item of dto.items) {
    const product = await this.prisma.product.findUnique({
      where: { barcode: item.barcode },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan barcode ${item.barcode} tidak ditemukan`);
    }

    const unit = await this.prisma.productUnit.findUnique({
      where: { id: item.unitId },
    });

    if (!unit || unit.productId !== product.id) {
      throw new NotFoundException(`Satuan tidak valid`);
    }

    const realStockNeeded = item.quantity * unit.multiplier;
    if (product.stock < realStockNeeded) {
      throw new BadRequestException(`Stok tidak cukup`);
    }

    const originalPrice = unit.price;

    let discountValue = 0; // FIXED

    if (item.discountPercent) {
      discountValue = (originalPrice * item.discountPercent) / 100;
    }

    if (item.discountValue) {
      discountValue = item.discountValue;
    }

    const finalPrice = originalPrice - discountValue;
    const subtotal = finalPrice * item.quantity;
    total += subtotal;

    itemsData.push({                   // FIXED
      productId: product.id,
      unitId: unit.id,
      quantity: item.quantity,
      unitPrice: originalPrice,
      unitMultiplier: unit.multiplier,
      discountPercent: item.discountPercent ?? 0,
      discountValue: discountValue,
      subtotal,
    });

    await this.prisma.product.update({
      where: { id: product.id },
      data: { stock: product.stock - realStockNeeded },
    });
  }

  return this.prisma.order.create({
    data: {
      userId,
      total,
      status: 'PENDING',
      paymentMethod: dto.paymentMethod,
      items: { create: itemsData }, // FIXED
    },
    include: { items: { include: { product: true, unit: true } } },
  });
}


  // ======================
  // ✔ HISTORY ORDER
  // ======================
  async getKasirHistory(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            unit: { select: { unitName: true, multiplier: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order, index) => {
      const totalItem = order.items.reduce((t, i) => t + i.quantity, 0);
      const totalPrice = order.items.reduce((t, i) => t + i.subtotal, 0);

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
