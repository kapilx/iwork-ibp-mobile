export enum QuestionType {
    TEXT = 'text',
    TEXT_AREA = 'textarea',
    NUMBER = 'number',
    SELECT = 'select',
}

export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    ARRAY = 'array',
}
export interface Question {
  key: string;
  type: QuestionType;
  label: string;
  options?: any[];
}

export interface PDFQuestionRequest {
  questions: Question[];
}

export interface QuestionAnswer {
  [questionKey: string]: any | null;
}

