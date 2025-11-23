export class AppendMessageDto {
  id!: string;

  role!: 'user' | 'assistant';

  content!: string;

  timestamp?: number;
}
