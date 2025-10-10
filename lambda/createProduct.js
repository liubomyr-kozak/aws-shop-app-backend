const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { randomUUID } = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
};

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const price = Number(body.price);
    const count = Number(body.count);

    if (!body.title || !Number.isFinite(price) || !Number.isFinite(count)) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ message: "Invalid payload" }),
      };
    }

    const id = randomUUID();

    await Promise.all([
      ddb.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: {
            id,
            title: body.title,
            description: body.description || "",
            price,
          },
        })
      ),
      ddb.send(
        new PutCommand({
          TableName: STOCK_TABLE,
          Item: {
            product_id: id,
            count,
          },
        })
      ),
    ]);

    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify({ id }),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
