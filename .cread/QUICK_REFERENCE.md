# AWS Shop Backend - Швидкий довідник

## Швидкий старт

```bash
# 1. Встановити залежності (після вирішення npm auth)
npm install
cd infra && npm install && cd ..

# 2. Bootstrap CDK (ОДИН РАЗ)
npm run deploy:bootstrap

# 3. Збірка та деплой
npm run deploy:all
```

## Основні команди

### Збірка
```bash
npm run bundle:all          # Повна збірка всіх сервісів
npm run bundle:products     # Збірка products + import сервісів  
npm run bundle:products-api # Тільки products API
npm run bundle:import-service # Тільки import сервіс
npm run clean               # Очистити всі build артефакти
```

### Деплой
```bash
npm run deploy:bootstrap    # Bootstrap CDK (один раз)
npm run deploy:all         # Деплой всіх стеків
npm run deploy:db          # Тільки база даних
npm run deploy:api         # Тільки API
npm run deploy:import      # Тільки import сервіс
```

### CDK команди
```bash
npm run cdk:diff           # Показати зміни перед deploy
npm run cdk:synth          # Генерувати CloudFormation
npm run cdk:destroy        # ВИДАЛИТИ всі ресурси
```

### Розробка
```bash
npm run start-api          # Локальний API сервер
npm run test               # Запустити тести
npm run seed:products      # Заповнити базу товарами
npm run seed:stocks        # Заповнити базу запасами
```

## Вирішення проблем

### 1. npm authentication error
```bash
npm login
# або
npm config set registry https://registry.npmjs.org/
```

### 2. Recursive cdk.out
✅ **ВИПРАВЛЕНО** - оновлено .gitignore та cdk.json

### 3. Bootstrap required
```bash
npm run deploy:bootstrap
```

### 4. Lambda не оновлюється
```bash
npm run clean
npm run deploy:all
```

## Структура проекту після змін

- ✅ Покращені bundle команди
- ✅ Додані clean команди
- ✅ Виправлена рекурсивна cdk.out проблема
- ✅ Додані команди для деплою
- ✅ Повна документація
