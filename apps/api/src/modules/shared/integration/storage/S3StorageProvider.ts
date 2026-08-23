import { IStorageProvider } from "@shared/business/storage/IStorageProvider"
import { ConfigService } from "@nestjs/config"

/**
 * Stores files in an AWS S3 bucket.
 *
 * Required env vars:
 *   STORAGE_S3_BUCKET     e.g. "my-app-uploads"
 *   STORAGE_S3_REGION     e.g. "us-east-1"
 *   STORAGE_S3_BASE_URL   e.g. "https://my-app-uploads.s3.amazonaws.com" (optional, derived from bucket+region if omitted)
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *
 * Install the AWS SDK before using:
 *   npm install @aws-sdk/client-s3
 */
export class S3StorageProvider implements IStorageProvider {
  private client: any
  private bucket: string
  private baseUrl: string

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>("storage.s3Bucket") ?? ""
    const region = config.get<string>("storage.s3Region") ?? "us-east-1"
    this.baseUrl =
      config.get<string>("storage.s3BaseUrl") ?? `https://${this.bucket}.s3.${region}.amazonaws.com`

    // Lazy-load the AWS SDK so the app starts even when the package is not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client } = require("@aws-sdk/client-s3")
      this.client = new S3Client({ region })
    } catch {
      throw new Error(
        "S3StorageProvider requires @aws-sdk/client-s3. Run: npm install @aws-sdk/client-s3",
      )
    }
  }

  async save(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PutObjectCommand } = require("@aws-sdk/client-s3")
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: mimeType,
      }),
    )
    return `${this.baseUrl}/${path}`
  }

  async delete(url: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3")
    // Extract the S3 key from the URL
    const key = url.replace(`${this.baseUrl}/`, "")
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
