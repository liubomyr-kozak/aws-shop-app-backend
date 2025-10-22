import { getProductsList } from "./getProductsListHandler";
import * as ProductService from "./productService";

describe("getProductsList Lambda", () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });


  it("should return 200", async () => {
    const response = await getProductsList();
    expect(response.statusCode).toBe(200);

  });

  it("should return body and array of products when request succeed", async () => {
    const response = await getProductsList();
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("should return 500 with the right message when error", async () => {
    jest.spyOn(ProductService, "getProducts").mockImplementation(() => {
      throw new Error("Mocked error");
    });

    const response = await getProductsList();

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toEqual(
      { message: "Something went wrong" }
    );

  });
});