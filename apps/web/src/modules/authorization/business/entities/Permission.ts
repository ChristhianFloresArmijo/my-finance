import { Entity } from '@/shared/business';

export interface PermissionProps {
  resource: string;
  action: string;
  description?: string | null;
}

export class Permission extends Entity<PermissionProps> {
  private constructor(props: PermissionProps, id?: string) {
    super(props, id);
  }

  static create(props: PermissionProps, id?: string): Permission {
    return new Permission(props, id);
  }

  /** Canonical permission string: "resource:action" */
  get name(): string { return `${this.props.resource}:${this.props.action}`; }
  get resource(): string { return this.props.resource; }
  get action(): string { return this.props.action; }
  get description(): string | null | undefined { return this.props.description; }

  /** Checks if this permission matches a given permission string (supports wildcards). */
  matches(permission: string): boolean {
    const name = this.name;
    if (name === permission) return true;
    if (name === '*:*') return true;

    const [resource, action] = permission.split(':');
    if (this.props.resource === resource && this.props.action === '*') return true;
    if (this.props.resource === '*' && this.props.action === action) return true;

    return false;
  }
}
