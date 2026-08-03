/**
 * Base Entity class for DDD.
 * Entities have a unique identifier and are compared by their ID.
 */
export abstract class Entity<T = unknown> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }
}
