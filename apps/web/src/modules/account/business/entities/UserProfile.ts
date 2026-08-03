import { Entity } from '@/shared/business';

export interface UserProfileProps {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
}

export class UserProfile extends Entity<UserProfileProps> {
  static create(props: UserProfileProps, id: string): UserProfile {
    return new UserProfile(props, id);
  }

  get first_name(): string { return this.props.first_name; }
  get last_name(): string { return this.props.last_name; }
  get full_name(): string { return this.props.full_name; }
  get email(): string { return this.props.email; }
}
