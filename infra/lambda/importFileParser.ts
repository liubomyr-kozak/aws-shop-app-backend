import { S3Event, S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as csv from "csv-parser";

const s3 = new S3Client({ region: process.env.AWS_REGION });

function streamToReadable(body: any): Readable {
  if (body instanceof Readable) return body;
  if (typeof body?.transformToWebStream === "function") {
    return Readable.fromWeb(body.transformToWebStream());
  }
  if (Symbol.asyncIterator in Object(body)) {
    return Readable.from(body as AsyncIterable<Uint8Array>);
  }
  throw new Error("Unsupported S3 Body stream type");
}

export const handler: S3Handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    console.error("Missing BUCKET_NAME env var");
    return;
  }

  const records = event.Records ?? [];
  for (const rec of records) {
    // isolate each record to avoid failing the whole batch
    try {
      const rawKey = rec.s3.object.key;
      const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      if (!key.startsWith("uploaded/")) {
        console.log(`Skipping non-uploaded key: ${key}`);
        continue;
      }

      console.log(`Processing object: ${key}`);

      const getRes = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const bodyStream = streamToReadable(getRes.Body as any);

      await new Promise<void>((resolve, reject) => {
        bodyStream
          .pipe(csv())
          .on("data", (data: any) => {
            console.log("Record:", data);
          })
          .on("end", () => resolve())
          .on("error", (err: unknown) => reject(err));
      });

      const destKey = key.replace(/^uploaded\//, "parsed/");

      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `/${bucket}/${encodeURIComponent(key)}`,
          Key: destKey,
        })
      );

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      console.log(`Moved ${key} -> ${destKey}`);
    } catch (err) {
      console.error("Error processing record:", err);
      // continue with next record
    }
  }
};
