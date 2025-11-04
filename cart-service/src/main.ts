import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateDatabaseConfig } from './config/database.config';

async function bootstrap() {
  validateDatabaseConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Cart service is running on port ${port}`);
}

bootstrap();
