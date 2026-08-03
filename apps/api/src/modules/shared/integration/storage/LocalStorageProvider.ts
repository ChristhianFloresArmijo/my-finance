import * as fs from "fs"
import * as nodePath from "path"
import { IStorageProvider } from "@shared/business/storage/IStorageProvider"

/**
 * Stores files on the local filesystem under `public/`.
 * The returned URL is a root-relative path served by NestJS's static assets middleware.
 *
 * Enable static serving in main.ts:
 *   app.useStaticAssets(join(process.cwd(), 'public'))
 */
export class LocalStorageProvider implements IStorageProvider {
  private readonly root = nodePath.join(process.cwd(), "public")

  async save(path: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const dest = nodePath.join(this.root, path)
    fs.mkdirSync(nodePath.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, buffer)
    // Return root-relative URL  e.g. "/avatars/user-123.jpg"
    return `/${path}`
  }

  async delete(url: string): Promise<void> {
    // url is root-relative, e.g. "/avatars/user-123.jpg"
    const filePath = nodePath.join(this.root, url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}
