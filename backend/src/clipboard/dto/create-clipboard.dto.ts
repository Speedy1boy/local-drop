import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { CreateClipboardPayload } from '@local-drop/shared';

export class CreateClipboardDto implements CreateClipboardPayload {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'link'])
  type?: string;
}