import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateClipboardDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'link'])
  type?: string;
}