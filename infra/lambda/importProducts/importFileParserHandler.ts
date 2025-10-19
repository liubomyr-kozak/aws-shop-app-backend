import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import csv from "csv-parser";

const s3 = new S3Client({ region: process.env.AWS_REGION });

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
    const records = [];

    await new Promise<void>((resolve, reject) => {
      bodyStream.pipe(csv())
        .on("data", (row) => {
          console.log("Parsed row:", row);
          records.push(row);
        })
        .on("end", () => {
          console.log(`Finished parsing ${records.length} rows`);
          resolve();
        })
        .on("error", reject);
    });
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    throw err;
  }
};
