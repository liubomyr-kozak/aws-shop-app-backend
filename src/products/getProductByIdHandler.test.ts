import { APIGatewayProxyEvent } from "aws-lambda";
import { getProductById } from "./getProductByIdHandler";
import * as ProductService from "./productService";

describe("getProductById Lambda", () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });


  it("should return 400 if productId is missing", async () => {
    const mockEvent = { pathParameters: {} } as APIGatewayProxyEvent;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe("Product ID is required");
  });

  it("should return 404 if product not found", async () => {
    const mockEvent = { pathParameters: { productId: "999" } } as unknown as  APIGatewayProxyEvent; 

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe("Product not found");
  });

  it("should return 200 if product exists", async () => {
    const mockEvent = { pathParameters: { productId: "1" } } as unknown as APIGatewayProxyEvent;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe("1");
    expect(body.title).toBe("Wireless Mouse");
  });
  
  it("should return 500 if getProducts throws", async () => {
    jest.spyOn(ProductService, "getProducts").mockImplementation(() => {
      throw new Error("Mocked error");
    });

    const mockEvent = { pathParameters: { productId: "1" } } as unknown as  APIGatewayProxyEvent;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("Something went wrong");
  });

});