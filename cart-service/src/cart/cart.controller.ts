import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemToCartDto } from '../dto/add-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Controller('api/profile/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Headers('x-user-id') userId: string) {
    if (!userId) {
      userId = 'anonymous';
    }
    return this.cartService.findOrCreateCart(userId);
  }

  @Put()
  async addItemToCart(
    @Headers('x-user-id') userId: string,
    @Body() addItemDto: AddItemToCartDto,
  ) {
    if (!userId) {
      userId = 'anonymous';
    }
    return this.cartService.addItemToCart(userId, addItemDto);
  }

  @Put(':productId')
  async updateItemInCart(
    @Headers('x-user-id') userId: string,
    @Param('productId') productId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    if (!userId) {
      userId = 'anonymous';
    }
    return this.cartService.updateItemInCart(userId, productId, updateItemDto.count);
  }

  @Delete(':productId')
  async removeItemFromCart(
    @Headers('x-user-id') userId: string,
    @Param('productId') productId: string,
  ) {
    if (!userId) {
      userId = 'anonymous';
    }
    return this.cartService.removeItemFromCart(userId, productId);
  }

  @Delete()
  async clearCart(@Headers('x-user-id') userId: string) {
    if (!userId) {
      userId = 'anonymous';
    }
    await this.cartService.clearCart(userId);
    return { message: 'Cart cleared successfully' };
  }

  @Post('checkout')
  async checkout(@Headers('x-user-id') userId: string) {
    if (!userId) {
      userId = 'anonymous';
    }
    return this.cartService.checkout(userId);
  }
}
