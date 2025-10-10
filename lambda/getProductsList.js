const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
};

exports.handler = async () => {
  try {
    const [prodResp, stockResp] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: PRODUCTS_TABLE })),
      ddb.send(new ScanCommand({ TableName: STOCK_TABLE })),
    ]);

    const stockMap = new Map(
      (stockResp.Items || []).map((s) => [s.product_id, s.count])
    );

    const items = (prodResp.Items || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      count: stockMap.get(p.id) ?? 0,
    }));

    return { statusCode: 200, headers: cors, body: JSON.stringify(items) };
  } catch (err) {
    console.error("getProductsList error:", err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ message: "Internal error" }),
    };
  }
};
