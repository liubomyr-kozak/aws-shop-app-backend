import http from "http";
import { getProductsList } from "./src/products/getProductsListHandler";
import { getProductById } from "./src/products/getProductByIdHandler";

const port = 3001;

const requestListener = async (req: any, res: any) => {
  // Allow Swagger UI and FE (or any origin) to call this API
  const allowedOrigins = ["http://localhost:3002", "http://localhost:3000"];
  const origin = req.headers.origin;
  console.log("🚀 ~ requestListener ~ origin:", origin)
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/products" && req.method === "GET") {
    const response = await getProductsList();
    res.writeHead(response.statusCode, { "Content-Type": "application/json" });
    res.end(response.body);
  } else if (req.url?.startsWith("/products/") && req.method === "GET") {
    const productId = req.url.split("/products/")[1];
    const event = { pathParameters: { productId } };
    // @ts-ignore
    const response = await getProductById(event);
    res.writeHead(response.statusCode, { "Content-Type": "application/json" });
    res.end(response.body);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
};

const server = http.createServer(requestListener);

server.listen(port, () => {
  console.log(`Local Lambda API running at http://localhost:${port}`);
});