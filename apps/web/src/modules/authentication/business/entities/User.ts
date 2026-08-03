import { Entity } from '@/shared/business';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserProps {
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  created_at: Date;
}

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  static create(props: UserProps, id?: string): User {
    return new User(props, id);
  }

  get first_name(): string { return this.props.first_name; }
  get last_name(): string { return this.props.last_name; }
  get full_name(): string { return `${this.props.first_name} ${this.props.last_name}`; }
  get email(): string { return this.props.email; }
  get status(): UserStatus { return this.props.status; }
  get isActive(): boolean { return this.props.status === 'ACTIVE'; }
  get created_at(): Date { return this.props.created_at; }
}
