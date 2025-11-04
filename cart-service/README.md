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

### Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure database credentials in `.env`**
   ```env
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_PORT=5432
   DB_USERNAME=cartadmin
   DB_PASSWORD=your-secure-password
   DB_NAME=cartdb
   DB_SYNCHRONIZE=true
   DB_LOGGING=false
   ```

3. **Install dependencies**
   ```bash
   yarn install --registry https://registry.npmjs.org/
   ```

4. **Run locally**
   ```bash
   npm run start:dev
   ```

### Security Best Practices

- ✅ `.env` file is in `.gitignore` - credentials are never committed
- ✅ Environment variables are validated on startup
- ✅ Database credentials stored securely in AWS Secrets Manager (production)
- ✅ Use `.env.example` as a template without sensitive data
- ⚠️ Never commit real credentials to version control
- ⚠️ Set `DB_SYNCHRONIZE=false` in production

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
