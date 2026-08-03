import { Entity } from '@/shared/business';

export interface RoleProps {
  name: string;
  display_name: string;
  description?: string;
}

export class Role extends Entity<RoleProps> {
  private constructor(props: RoleProps, id?: string) {
    super(props, id);
  }

  static create(props: RoleProps, id?: string): Role {
    return new Role(props, id);
  }

  get name(): string { return this.props.name; }
  get display_name(): string { return this.props.display_name; }
  get description(): string | undefined { return this.props.description; }
}
