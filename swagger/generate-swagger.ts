import fs from "fs";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

// Configure swagger-jsdoc
const options = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "My Products API",
      version: "1.0.0",
      description: "Swagger docs generated from @openapi comments",
    },
    servers: [
      {
        url: "http://localhost:3001", // temporary placeholder, not calling Lambda yet
      },
    ],
  },
  apis: [path.join(__dirname, "../src/*.ts")], // path to your Lambda handlers
};

const swaggerSpec = swaggerJSDoc(options);

// Write swagger.json
fs.writeFileSync(path.join(__dirname, "swagger.json"), JSON.stringify(swaggerSpec, null, 2));

console.log("swagger.json generated!");
