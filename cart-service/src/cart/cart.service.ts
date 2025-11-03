import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { AddItemToCartDto } from '../dto/add-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async findOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, status: CartStatus.OPEN },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        status: CartStatus.OPEN,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { userId, status: CartStatus.OPEN },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }

  async addItemToCart(userId: string, addItemDto: AddItemToCartDto): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);

    const existingItem = cart.items.find(
      (item) => item.productId === addItemDto.productId,
    );

    if (existingItem) {
      existingItem.count += addItemDto.count;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: addItemDto.productId,
        count: addItemDto.count,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.getCart(userId);
  }

  async updateItemInCart(
    userId: string,
    productId: string,
    count: number,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);

    const item = cart.items.find((item) => item.productId === productId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    if (count <= 0) {
      await this.cartItemRepository.delete({
        cartId: cart.id,
        productId,
      });
    } else {
      item.count = count;
      await this.cartItemRepository.save(item);
    }

    return this.getCart(userId);
  }

  async removeItemFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    await this.cartItemRepository.delete({
      cartId: cart.id,
      productId,
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
  }

  async checkout(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.status = CartStatus.ORDERED;
    await this.cartRepository.save(cart);
    return cart;
  }

  async deleteCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    await this.cartRepository.delete(cart.id);
  }
}
