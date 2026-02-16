
export enum MentorMode {
  TEACHING = 'TEACHING',
  DEBUGGING = 'DEBUGGING',
  PROJECT_BUILDER = 'PROJECT_BUILDER',
  CAREER_GROWTH = 'CAREER_GROWTH',
  CODE_REVIEW = 'CODE_REVIEW',
  MOTIVATION = 'MOTIVATION',
  PROBLEM_SOLVER = 'PROBLEM_SOLVER'
}

export interface MessageImage {
  data: string; // base64 string
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: MentorMode;
  image?: MessageImage;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  mode: MentorMode;
  lastModified: number;
}

export interface AppState {
  currentMode: MentorMode;
  messages: Message[];
  isThinking: boolean;
  codeSnippet: string;
}
