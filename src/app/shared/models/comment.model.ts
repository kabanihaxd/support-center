export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
  /** Внутренняя заметка — видят только сотрудники поддержки */
  internal: boolean;
}
