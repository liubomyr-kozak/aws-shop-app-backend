# AWS Shop Backend - Повна документація

## Огляд проекту

Це AWS-based e-commerce backend додаток, побудований з використанням:
- **AWS CDK** - для інфраструктури як код
- **AWS Lambda** - для безсерверних функцій
- **DynamoDB** - для зберігання даних
- **S3** - для файлового сховища
- **SQS/SNS** - для асинхронної обробки повідомлень
- **API Gateway** - для REST API

## Архітектура системи

```
Frontend → API Gateway → Lambda Functions → DynamoDB
                    ↓
                   S3 ← Import Service → SQS → SNS
```

### Основні компоненти:

1. **Products API Stack** - основне API для товарів
2. **Products DB Stack** - база даних для товарів і запасів
3. **Import Service Stack** - сервіс імпорту CSV файлів
4. **SQS Catalog Stack** - черга для обробки каталогу
5. **SNS Products Stack** - уведомлення про товари

## Структура проекту

```
├── src/                          # Вихідний код Lambda функцій
│   ├── products/                 # API для товарів
│   │   ├── getProductsListHandler.ts
│   │   ├── getProductByIdHandler.ts
│   │   ├── createProductHandler.ts
│   │   └── catalogBatchProcessHandler.ts
│   ├── importProducts/           # Сервіс імпорту
│   │   ├── importProductsFileHandler.ts
│   │   └── importFileParserHandler.ts
│   └── utils.ts                  # Утиліти
├── infra/                        # CDK інфраструктура
│   ├── lib/                      # CDK стеки
│   └── bin/infra.ts             # Точка входу CDK
├── scripts/                      # Скрипти для заповнення БД
├── swagger/                      # API документація
└── dist/                        # Зібрані файли (не включається в Git)
```

## Потік даних

### 1. Products API Flow
```
Client Request → API Gateway → Lambda → DynamoDB → Response
```

### 2. Import Products Flow
```
CSV Upload → S3 → Lambda Trigger → Parse CSV → SQS → Batch Process → DynamoDB → SNS Notification
```

### 3. Stock Management Flow
```
Product Creation → Products Table + Stocks Table → Joined Response
```

## Налаштування проекту

### Передумови
```bash
# Встановіть Node.js (версія 20+)
# Встановіть AWS CLI
# Налаштуйте AWS профіль cloudx-js
aws configure --profile cloudx-js
```

### Встановлення залежностей
```bash
# Основні залежності
npm install

# CDK залежності
cd infra
npm install
cd ..
```

### Налаштування змінних середовища
Створіть `.env` файл:
```
AWS_REGION=us-east-1
FRONTEND_ORIGIN=https://your-frontend-domain.com
```

## Команди для розробки

### Збірка проекту
```bash
# Збірка TypeScript
npm run build

# Збірка Lambda функцій (оптимізована)
npm run bundle:all

# Збірка з відстеженням змін
npm run bundle:watch
```

### Тестування
```bash
# Запуск тестів
npm test

# Локальний API сервер
npm run start-api
```

### Заповнення бази даних
```bash
# Заповнення товарів
npm run seed:products

# Заповнення запасів
npm run seed:stocks
```

## Деплой на AWS

### 1. Bootstrap CDK (ОБОВ'ЯЗКОВО - один раз)
```bash
cd infra
npx cdk bootstrap aws://410859982763/us-east-1 --profile cloudx-js
```

**Чому потрібен Bootstrap:**
- CDK використовує S3 bucket для зберігання великих assets (Lambda код)
- Bootstrap створює необхідні ресурси (S3 bucket, IAM roles) для CDK
- Без bootstrap неможливо деплоїти стеки з assets

### 2. Збірка перед деплоєм
```bash
# Повернутися в корінь проекту
cd ..

# Збірка всіх Lambda функцій
npm run bundle:all
```

### 3. Деплой всіх стеків
```bash
cd infra
npx cdk deploy --all --profile cloudx-js --require-approval never
```

### 4. Деплой окремих стеків
```bash
# База даних
npx cdk deploy ProductsDbStack --profile cloudx-js

# API
npx cdk deploy ProductsApiStack --profile cloudx-js

# Імпорт сервіс
npx cdk deploy ImportServiceStack --profile cloudx-js

# SQS та SNS
npx cdk deploy CatalogSqs --profile cloudx-js
npx cdk deploy ProductSnsStack --profile cloudx-js
```

## Troubleshooting - Типові проблеми

### 1. "Bootstrap required" Error
**Проблема:** `This stack uses assets, so the toolkit stack must be deployed to the environment`

**Рішення:**
```bash
cd infra
npx cdk bootstrap aws://410859982763/us-east-1 --profile cloudx-js
```

### 2. Recursive cdk.out проблема
**Проблема:** CDK створює cdk.out всередині cdk.out

**Рішення:** Додано виключення в `cdk.json` та `.gitignore`

### 3. Lambda function не оновлюється
**Проблема:** Код Lambda не оновлюється після змін

**Рішення:**
```bash
# Пересоберіть код
npm run bundle:all

# Форсований деплой
cd infra
npx cdk deploy --all --profile cloudx-js --force
```

### 4. DynamoDB Access Denied
**Проблема:** Lambda не може читати/писати в DynamoDB

**Рішення:** Перевірте IAM policies в CDK стеках

### 5. CORS помилки
**Проблема:** Frontend не може отримати доступ до API

**Рішення:** Налаштуйте `FRONTEND_ORIGIN` в змінних середовища

### 6. Memory/Timeout помилки Lambda
**Проблема:** Lambda функції падають через недостатню пам'ять або таймаут

**Рішення:** Збільште memory та timeout в CDK стеках

### 7. S3 Access помилки
**Проблема:** Неможливо завантажити файли в S3

**Рішення:**
```bash
# Перевірте права доступу
aws s3 ls --profile cloudx-js

# Перевірте bucket policy
```

## API Endpoints

### Products API
- `GET /products` - отримати всі товари
- `GET /products/{id}` - отримати товар за ID
- `POST /products` - створити новий товар

### Import API
- `GET /import` - отримати signed URL для завантаження
- Автоматична обробка CSV файлів через SQS

## Моніторинг та логи

### CloudWatch Logs
```bash
# Перегляд логів Lambda
aws logs describe-log-groups --profile cloudx-js
aws logs tail /aws/lambda/function-name --follow --profile cloudx-js
```

### CloudWatch Metrics
- Lambda виконання та помилки
- API Gateway метрики
- DynamoDB читання/запис
- SQS черги повідомлень

## Безпека

### IAM Policies
- Мінімальні необхідні права для кожної Lambda
- Окремі ролі для різних сервісів
- S3 bucket policies для безпечного доступу

### Environment Variables
- Не зберігайте секрети в коді
- Використовуйте AWS Secrets Manager для чутливих даних
- Налаштуйте змінні в CDK стеках

## Розробка та розширення

### Додавання нової Lambda функції
1. Створіть файл в `src/`
2. Додайте до відповідного bundle команди
3. Створіть/оновіть CDK стек
4. Додайте до API Gateway

### Додавання нової таблиці DynamoDB
1. Оновіть `products-db-stack.ts`
2. Додайте необхідні індекси
3. Оновіть IAM policies

### Тестування
- Unit тести для Lambda функцій
- Integration тести з моками AWS сервісів
- E2E тести через API Gateway

## Корисні команди

```bash
# Переглянути різницю перед деплоєм
npx cdk diff --profile cloudx-js

# Знищити всі стеки (ОБЕРЕЖНО!)
npx cdk destroy --all --profile cloudx-js

# Переглянути CloudFormation шаблони
npx cdk synth

# Переглянути логи деплою
aws cloudformation describe-stack-events --stack-name YourStackName --profile cloudx-js
```

## Підтримка та розвиток

Для розвитку проекту:
1. Створіть feature branch
2. Внесіть зміни
3. Протестуйте локально
4. Деплойте на dev environment
5. Створіть pull request

Цей проект використовує Infrastructure as Code підхід, тому всі зміни в інфраструктурі повинні йти через CDK стеки.
