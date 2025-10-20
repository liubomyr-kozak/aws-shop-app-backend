import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
import csv from "csv-parser";

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const CATALOG_QUEUE_URL = process.env.CATALOG_QUEUE_URL as string;

export const importFileParser = async (event: S3Event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const [record] = event.Records ?? [];

  if (!record) {
    console.error("No S3 records found in event");
    return;
  }

  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;

  console.log(`Reading file from s3://${bucket}/${key}`);

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await s3.send(command);


    if (!data.Body) {
      console.error("No Body returned from S3 GetObjectCommand");
      return;
    }
    const bodyStream = data.Body as NodeJS.ReadableStream;

    await new Promise<void>((resolve, reject) => {
      bodyStream.pipe(csv())
        .on("data", async (row) => {
          console.log("Parsed row:", row);
          try {
            await sqs.send(new SendMessageCommand({
              QueueUrl: CATALOG_QUEUE_URL,
              MessageBody: JSON.stringify(row),
              MessageGroupId: "import", // required for FIFO queue
            }));
            console.log("Sent row to SQS");
          } catch (err) {
            console.error("Failed to send SQS message:", err);
          }
        })
        .on("end", () => {
          console.log(`Finished parsing and sending rows`);
          resolve();
        })
        .on("error", reject);
    });
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    throw err;
  }
};
