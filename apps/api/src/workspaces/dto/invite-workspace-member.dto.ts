import { IsEmail } from 'class-validator';

export class InviteWorkspaceMemberDto {
  @IsEmail()
  email!: string;
}
