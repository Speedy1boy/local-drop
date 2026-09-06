import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { CreateNotePayload } from '@local-drop/shared';

export class CreateNoteDto implements CreateNotePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];
}