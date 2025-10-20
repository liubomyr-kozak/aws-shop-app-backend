import { SQSEvent, SQSRecord } from "aws-lambda";
import { catalogBatchProcess } from "./catalogBatchProcessHandler";
import * as utils from "../utils";
import { SNSClient } from "@aws-sdk/client-sns";

jest.mock("../utils");
jest.mock("@aws-sdk/client-sns");

const mockCreateProductTransaction = utils.createProductTransaction as jest.MockedFunction<typeof utils.createProductTransaction>;
const mockSNSClient = SNSClient as jest.MockedClass<typeof SNSClient>;
const mockSend = jest.fn();

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSNSClient.prototype.send = mockSend;
    process.env.CREATE_PRODUCT_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:test-topic";
  });

  afterEach(() => {
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;
  });

  it("should process SQS messages and create products", async () => {
    // Arrange
    const mockProductId = "test-id-123";
    mockCreateProductTransaction.mockResolvedValue(mockProductId);
    mockSend.mockResolvedValue({});

    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            description: "Test Description",
            price: 99.99,
            count: 10
          }),
          messageId: "test-message-1",
          receiptHandle: "test-receipt-1",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord
      ]
    };

    // Act
    await catalogBatchProcess(sqsEvent);

    // Assert
    expect(mockCreateProductTransaction).toHaveBeenCalledWith({
      title: "Test Product",
      description: "Test Description",
      price: 99.99,
      count: 10
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
          Subject: "Batch Product Creation",
          Message: JSON.stringify({
            products: [{
              id: mockProductId,
              title: "Test Product",
              description: "Test Description",
              price: 99.99,
              count: 10
            }]
          })
        })
      })
    );
  });

  it("should process multiple SQS messages in batch", async () => {
    // Arrange
    mockCreateProductTransaction
      .mockResolvedValueOnce("id-1")
      .mockResolvedValueOnce("id-2");
    mockSend.mockResolvedValue({});

    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 10.99,
            count: 5
          }),
          messageId: "test-message-1",
          receiptHandle: "test-receipt-1",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5-1",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord,
        {
          body: JSON.stringify({
            title: "Product 2",
            description: "Description 2",
            price: 20.99,
            count: 3
          }),
          messageId: "test-message-2",
          receiptHandle: "test-receipt-2",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5-2",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord
      ]
    };

    // Act
    await catalogBatchProcess(sqsEvent);

    // Assert
    expect(mockCreateProductTransaction).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Message: JSON.stringify({
            products: [
              { id: "id-1", title: "Product 1", description: "Description 1", price: 10.99, count: 5 },
              { id: "id-2", title: "Product 2", description: "Description 2", price: 20.99, count: 3 }
            ]
          })
        })
      })
    );
  });

  it("should handle errors gracefully and continue processing other records", async () => {
    // Arrange
    mockCreateProductTransaction
      .mockRejectedValueOnce(new Error("Database error"))
      .mockResolvedValueOnce("id-2");
    mockSend.mockResolvedValue({});

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Failing Product",
            description: "This will fail",
            price: 10.99,
            count: 5
          }),
          messageId: "test-message-1",
          receiptHandle: "test-receipt-1",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5-1",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord,
        {
          body: JSON.stringify({
            title: "Success Product",
            description: "This will succeed",
            price: 20.99,
            count: 3
          }),
          messageId: "test-message-2",
          receiptHandle: "test-receipt-2",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5-2",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord
      ]
    };

    // Act
    await catalogBatchProcess(sqsEvent);

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Message: JSON.stringify({
            products: [
              { id: "id-2", title: "Success Product", description: "This will succeed", price: 20.99, count: 3 }
            ]
          })
        })
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should not send SNS message if no products were created", async () => {
    // Arrange
    mockCreateProductTransaction.mockRejectedValue(new Error("All failed"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Failing Product",
            description: "This will fail",
            price: 10.99,
            count: 5
          }),
          messageId: "test-message-1",
          receiptHandle: "test-receipt-1",
          attributes: {},
          messageAttributes: {},
          md5OfBody: "test-md5-1",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1"
        } as SQSRecord
      ]
    };

    // Act
    await catalogBatchProcess(sqsEvent);

    // Assert
    expect(mockSend).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
