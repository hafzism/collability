import { Exclude } from 'class-transformer';
import { User } from '@repo/database';

export class UserEntity implements User {
  id!: string;
  email!: string;
  name!: string;
  avatarUrl!: string | null;

  @Exclude()
  passwordHash!: string;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
