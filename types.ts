export type UserRole = 'student' | 'teacher';
export type Screen = 'home' | 'recommended' | 'quiz' | 'class' | 'settings' | 'video';

export interface User {
  id: string;
  name: string;
  email: string;
  className: string;
  role: UserRole;
  points: number;
  avatarColor: string;
  tracksStudyTime: boolean;
}

export interface Todo {
  id: number;
  text: string;
  dueDate: string;
  completed: boolean;
}

export interface Comment {
    id: number;
    author: string;
    text: string;
    isQuestion: boolean;
    replies: Comment[];
}

export interface Video {
    id: number;
    title: string;
    uploader: string;
    thumbnail: string;
    src: string;
    description: string;
    comments: Comment[];
}

export interface QuizQuestion {
    type: 'multiple-choice' | 'descriptive';
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface Quiz {
    id: number;
    title: string;
    relatedVideoId?: number;
    questions: QuizQuestion[];
    authorName: string;
    className: string;
}

export interface Notification {
    id: number;
    message: string;
    read: boolean;
    videoId?: number;
    commentId?: number;
}

export interface CalendarEvent {
    id: number;
    title: string;
    date: string; // ISO string for datetime
    repeat: 'none' | 'daily' | 'weekly';
    notification: 'none' | '5' | '10' | '30';
}
