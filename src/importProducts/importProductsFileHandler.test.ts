import { importProductsFile } from './importProductsFileHandler';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner');

const s3Mock = mockClient(S3Client);

describe('importProductsFile', () => {
  beforeEach(() => {
    s3Mock.reset();
    (getSignedUrl as jest.Mock).mockReset();
  });

  it('should return a signed URL when file name is provided', async () => {
    const signedUrl = 'https://signed-url.example.com';
    (getSignedUrl as jest.Mock).mockResolvedValue(signedUrl);

    const event = {
      queryStringParameters: { name: 'test.csv' }
    };
    const result = await importProductsFile(event as any);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).signedUrl).toBe(signedUrl);
  });

  it('should return 400 if file name is missing', async () => {
    const event = { queryStringParameters: {} };
    const result = await importProductsFile(event as any);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toMatch(/File name is required/);
  });

  it('should return 500 if getSignedUrl throws an error', async () => {
    (getSignedUrl as jest.Mock).mockRejectedValue(new Error('S3 error'));
    const event = {
      queryStringParameters: { name: 'test.csv' }
    };
    const result = await importProductsFile(event as any);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toMatch(/Failed to generate signed URL/);
  });
});