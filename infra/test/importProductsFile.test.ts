import { handler } from "../lambda/importProductsFile";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(async () => "https://signed-url"),
}));

describe("importProductsFile", () => {
  beforeAll(() => {
    process.env.BUCKET_NAME = "test-bucket";
  });

  it("returns 400 when name is missing", async () => {
    const res = await handler({} as any);
    expect(res.statusCode).toBe(400);
  });

  it("returns signed url when name is provided", async () => {
    const res = await handler({
      queryStringParameters: { name: "file.csv" },
    } as any);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.url).toBe("https://signed-url");
    expect(getSignedUrl).toHaveBeenCalled();
  });
});
