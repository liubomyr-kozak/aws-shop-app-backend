# Cart Service

NestJS-based cart service for AWS Shop Backend, deployed on AWS Lambda with RDS PostgreSQL.

## Features

- Create and manage shopping carts
- Add/remove items from cart
- Update item quantities
- Checkout functionality
- PostgreSQL database with TypeORM

## API Endpoints

- `GET /api/profile/cart` - Get user's cart
- `PUT /api/profile/cart` - Add item to cart
- `PUT /api/profile/cart/:productId` - Update item quantity
- `DELETE /api/profile/cart/:productId` - Remove item from cart
- `DELETE /api/profile/cart` - Clear cart
- `POST /api/profile/cart/checkout` - Checkout cart

## Database Schema

### Cart Table
- `id` - UUID (Primary Key)
- `user_id` - String (not null)
- `status` - Enum ('OPEN', 'ORDERED')
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Cart Items Table
- `cart_id` - UUID (Foreign Key to carts.id)
- `product_id` - String (not null)
- `count` - Integer

## Local Development

```bash
# Install dependencies
yarn install --registry https://registry.npmjs.org/

# Set up environment variables
cp .env.example .env

# Run locally
npm run start:dev
```

## Deployment

The service is deployed using AWS CDK with the following resources:
- AWS Lambda (NestJS application)
- API Gateway (HTTP endpoints)
- RDS PostgreSQL (Database)
- VPC (Network isolation)
- Secrets Manager (Database credentials)

Deploy with:
```bash
npm run deploy:cart
```
