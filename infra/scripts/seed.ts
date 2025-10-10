
const AWS = require('aws-sdk');
const crypto = require('crypto');

// Configure AWS SDK
const docClient = new AWS.DynamoDB.DocumentClient();

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || 'stock';

AWS.config.update({ region: REGION });

// Sample products data
const sampleProducts = [
    {
        title: 'iPhone 14 Pro',
        description: 'Latest iPhone with A16 Bionic chip and Pro camera system',
        price: 999,
        count: 25
    },
    {
        title: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone with excellent camera',
        price: 899,
        count: 30
    },
    {
        title: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip',
        price: 1999,
        count: 15
    },
    {
        title: 'iPad Air',
        description: 'Versatile tablet perfect for work and entertainment',
        price: 599,
        count: 40
    },
    {
        title: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        price: 249,
        count: 100
    },
    {
        title: 'Apple Watch Series 8',
        description: 'Advanced smartwatch with health monitoring',
        price: 399,
        count: 60
    },
    {
        title: 'Sony WH-1000XM5',
        description: 'Premium noise-canceling headphones',
        price: 399,
        count: 35
    },
    {
        title: 'Nintendo Switch OLED',
        description: 'Hybrid gaming console with OLED screen',
        price: 349,
        count: 50
    }
];

async function clearTables() {
    console.log('🧹 Clearing existing data from tables...');

    try {
        // Clear products table
        const productsData = await docClient.scan({ TableName: PRODUCTS_TABLE_NAME }).promise();
        if (productsData.Items && productsData.Items.length > 0) {
            const deleteRequests = productsData.Items.map(item => ({
                DeleteRequest: { Key: { id: item.id } }
            }));

            // Batch delete in chunks of 25 (DynamoDB limit)
            for (let i = 0; i < deleteRequests.length; i += 25) {
                const batch = deleteRequests.slice(i, i + 25);
                await docClient.batchWrite({
                    RequestItems: {
                        [PRODUCTS_TABLE_NAME]: batch
                    }
                }).promise();
            }
            console.log(`✅ Cleared ${productsData.Items.length} products`);
        }

        // Clear stock table
        const stockData = await docClient.scan({ TableName: STOCK_TABLE_NAME }).promise();
        if (stockData.Items && stockData.Items.length > 0) {
            const deleteRequests = stockData.Items.map(item => ({
                DeleteRequest: { Key: { product_id: item.product_id } }
            }));

            // Batch delete in chunks of 25
            for (let i = 0; i < deleteRequests.length; i += 25) {
                const batch = deleteRequests.slice(i, i + 25);
                await docClient.batchWrite({
                    RequestItems: {
                        [STOCK_TABLE_NAME]: batch
                    }
                }).promise();
            }
            console.log(`✅ Cleared ${stockData.Items.length} stock records`);
        }
    } catch (error) {
        console.error('❌ Error clearing tables:', error);
        throw error;
    }
}

async function seedData() {
    console.log('🌱 Seeding sample data...');

    const timestamp = new Date().toISOString();

    for (const product of sampleProducts) {
        try {
            const id = crypto.randomUUID();

            const productItem = {
                id,
                title: product.title,
                description: product.description,
                price: product.price,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            const stockItem = {
                product_id: id,
                count: product.count,
                updatedAt: timestamp
            };

            // Use transaction to ensure both records are created together
            await docClient.transactWrite({
                TransactItems: [
                    {
                        Put: {
                            TableName: PRODUCTS_TABLE_NAME,
                            Item: productItem,
                            ConditionExpression: 'attribute_not_exists(id)'
                        }
                    },
                    {
                        Put: {
                            TableName: STOCK_TABLE_NAME,
                            Item: stockItem,
                            ConditionExpression: 'attribute_not_exists(product_id)'
                        }
                    }
                ]
            }).promise();

            console.log(`✅ Created product: ${product.title} (ID: ${id})`);
        } catch (error) {
            console.error(`❌ Error creating product ${product.title}:`, error);
        }
    }
}

async function verifyData() {
    console.log('🔍 Verifying seeded data...');

    try {
        const [productsResult, stockResult] = await Promise.all([
            docClient.scan({ TableName: PRODUCTS_TABLE_NAME }).promise(),
            docClient.scan({ TableName: STOCK_TABLE_NAME }).promise()
        ]);

        console.log(`📊 Products table: ${productsResult.Items?.length || 0} records`);
        console.log(`📊 Stock table: ${stockResult.Items?.length || 0} records`);

        // Verify data consistency
        const productIds = new Set(productsResult.Items?.map(p => p.id) || []);
        const stockProductIds = new Set(stockResult.Items?.map(s => s.product_id) || []);

        const missingStock = [...productIds].filter(id => !stockProductIds.has(id));
        const orphanedStock = [...stockProductIds].filter(id => !productIds.has(id));

        if (missingStock.length > 0) {
            console.warn(`⚠️  Products without stock records: ${missingStock.length}`);
        }

        if (orphanedStock.length > 0) {
            console.warn(`⚠️  Stock records without products: ${orphanedStock.length}`);
        }

        if (missingStock.length === 0 && orphanedStock.length === 0) {
            console.log('✅ Data consistency verified - all products have corresponding stock records');
        }

        // Display sample of created data
        if (productsResult.Items && productsResult.Items.length > 0) {
            console.log('\n📋 Sample products:');
            productsResult.Items.slice(0, 3).forEach(product => {
                const stock = stockResult.Items?.find(s => s.product_id === product.id);
                console.log(`  • ${product.title} - $${product.price} (Stock: ${stock?.count || 0})`);
            });
        }

    } catch (error) {
        console.error('❌ Error verifying data:', error);
    }
}

async function main() {
    console.log('🚀 Starting database seeding process...');
    console.log(`📍 Target tables: ${PRODUCTS_TABLE_NAME}, ${STOCK_TABLE_NAME}`);

    try {
        await clearTables();
        await seedData();
        await verifyData();

        console.log('\n🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('\n💥 Seeding process failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = {
    clearTables,
    seedData,
    verifyData,
    sampleProducts
};
