const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
};

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.productId;
    if (!id)
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ message: "productId required" }),
      };

    await ddb.send(
      new DeleteCommand({ TableName: STOCK_TABLE, Key: { product_id: id } })
    );
    await ddb.send(
      new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id } })
    );

    return { statusCode: 204, headers: cors, body: "" };
  } catch (err) {
    console.error("deleteProduct error:", err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ message: "Internal error" }),
    };
  }
};
