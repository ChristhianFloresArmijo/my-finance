export interface IStorageProvider {
  /**
   * Persist a file and return its public URL.
   * @param path    Relative path within the storage (e.g. "avatars/user-123.jpg")
   * @param buffer  Raw file bytes
   * @param mimeType  MIME type of the file (e.g. "image/jpeg")
   */
  save(path: string, buffer: Buffer, mimeType: string): Promise<string>

  /**
   * Remove a file by the URL previously returned by save().
   * Implementations should not throw if the file does not exist.
   */
  delete(url: string): Promise<void>
}

export const STORAGE_PROVIDER = "STORAGE_PROVIDER"
