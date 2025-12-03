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
  return this.prisma.$transaction(async (tx) => {
    let subtotal = 0;              // 👈 Sub Total (jumlah semua item setelah diskon item)
    const itemsData: any[] = [];

    for (const item of dto.items) {
      // 1. Cari produk by barcode
      const product = await tx.product.findUnique({
        where: { barcode: item.barcode },
      });

      if (!product) {
        throw new NotFoundException(
          `Produk dengan barcode ${item.barcode} tidak ditemukan`,
        );
      }

      // 2. Cari unit yg dipilih
      const unit = await tx.productUnit.findUnique({
        where: { id: item.unitId },
      });

      if (!unit || unit.productId !== product.id) {
        throw new NotFoundException('Satuan tidak valid');
      }

      // 3. Hitung kebutuhan stok (dalam PCS)
      const realStockNeeded = item.quantity * unit.multiplier;
      if (product.stock < realStockNeeded) {
        throw new BadRequestException('Stok tidak cukup');
      }

      // 4. Harga asli per UNIT (Dus/Pack/pcs) – sudah otomatis dari ProductUnit
      const originalUnitPrice = unit.price;

      // 5. Diskon per UNIT (item-level, seperti "Diskon 20%" di baris 1)
      let itemDiscountValue = 0;

      if (item.discountPercent) {
        itemDiscountValue =
          (originalUnitPrice * item.discountPercent) / 100;
      }

      if (item.discountValue) {
        // di sini diasumsikan discountValue = potongan per UNIT
        itemDiscountValue = item.discountValue;
      }

      const finalUnitPrice = originalUnitPrice - itemDiscountValue; // harga/unit setelah diskon
      const lineSubtotal = finalUnitPrice * item.quantity;          // total baris
      subtotal += lineSubtotal;

      itemsData.push({
        productId: product.id,
        unitId: unit.id,
        quantity: item.quantity,
        unitPrice: originalUnitPrice,           // harga/unit sebelum diskon
        unitMultiplier: unit.multiplier,        // PCS per unit
        discountPercent: item.discountPercent ?? 0,
        discountValue: itemDiscountValue,       // potongan per UNIT
        subtotal: lineSubtotal,                 // total baris setelah diskon item
      });

      // 6. Kurangi stok produk (dalam PCS)
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: realStockNeeded },
        },
      });
    }

    // ========================
    // 7. DISKON & PAJAK ORDER
    // ========================
    // Nilai ini yang muncul di bagian:
    // Sub Total / Diskon / Pajak / Total (kanan bawah)

    const orderDiscountPercent = dto.discountPercent ?? 0;
    let orderDiscountValue = dto.discountValue ?? 0;

    if (!dto.discountValue && orderDiscountPercent > 0) {
      orderDiscountValue = (subtotal * orderDiscountPercent) / 100;
    }

    const afterDiscount = subtotal - orderDiscountValue;

    const taxPercent = dto.taxPercent ?? 0;   // di UI: 11%
    let taxValue = dto.taxValue ?? 0;

    if (!dto.taxValue && taxPercent > 0) {
      taxValue = (afterDiscount * taxPercent) / 100;
    }

    const total = afterDiscount + taxValue;

    // ========================
    // 8. CREATE ORDER
    // ========================
    const order = await tx.order.create({
      data: {
        userId,
        subtotal,                // 👈 Sub Total (sesuai UI)
        discountPercent: orderDiscountPercent,
        discountValue: orderDiscountValue,
        taxPercent,
        taxValue,
        total,                   // 👈 Total setelah diskon + pajak
        status: 'COMPLETED',       // atau OrderStatus.PENDING kalau kamu import enum-nya
        paymentMethod: dto.paymentMethod,
        items: { create: itemsData },
      },
      include: {
        items: {
          include: {
            product: true,
            unit: true,
          },
        },
      },
    });

    return order;
  });
}


  // ======================
  // ✔ SEARCH ORDER
  // ======================

  // 🔍 1) Search berdasarkan nama / barcode saja
async searchProducts(query?: string) {
  const where: any = {};

  if (query && query.trim() !== '') {
    where.OR = [
      { name: { contains: query } },
      { barcode: { contains: query } },
    ];
  }

  return this.prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  });
}

// 🧩 2) Filter berdasarkan kategori saja
async getProductsByCategory(category?: string) {
  const where: any = {};

  // kalau "ALL" atau kosong → tampilkan semua
  if (category && category !== 'ALL') {
    where.category = { name: category };
  }

  return this.prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
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
