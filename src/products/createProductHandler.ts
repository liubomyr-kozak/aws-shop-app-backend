import type { Handler } from "aws-lambda";
import { createProductTransaction } from "../utils";

export const createProduct: Handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { title, description, price, count } = body;

    // todo: add zod for validation
    if (!title || !price || !count || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "title, price, description and count are required" }),
      };
    }

    if (typeof price !== "number" || typeof count !== "number" || typeof title !== "string" || typeof description !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid fields" }),
      };
    }

    const id = await createProductTransaction({ title, description, price, count });

    return {
      statusCode: 201,
      body: JSON.stringify({ id, title, description, price, count }),
    };
  } catch (err) {
    console.error("Create product error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
};