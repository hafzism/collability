import { Exclude } from 'class-transformer';
import { AuthProvider, User } from '@repo/database';

export class UserEntity implements User {
  id!: string;
  email!: string;
  name!: string;
  avatarUrl!: string | null;
  authProvider!: AuthProvider;

  @Exclude()
  passwordHash!: string | null;

  @Exclude()
  googleId!: string | null;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
