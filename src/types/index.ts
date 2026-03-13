// Re-export Prisma types for convenience
export type {
  User,
  UserProfile,
  Course,
  LearningOutcome,
  Assessment,
  Rubric,
  RubricCriteria,
  AssessmentSession,
  Interaction,
  AssessmentResult,
  OutcomeResult,
  AnalyticsEvent,
  FeedbackEntry,
  ErrorLog,
} from "../../generated/prisma/client";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Assessment Session types
export interface AssessmentSessionWithDetails {
  id: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpent: number | null;
  assessment: {
    id: string;
    title: string;
    course: {
      code: string;
      title: string;
    };
  };
  interactions: {
    id: string;
    sequence: number;
    type: string;
    prompt: string;
    response: string | null;
    evaluation: string | null;
  }[];
  result: {
    overallScore: number;
    passed: boolean;
    cplRecommendation: string;
  } | null;
}

// AI Interaction types
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIEvaluation {
  score: number;
  feedback: string;
  learningOutcomes: {
    outcomeId: string;
    demonstrated: boolean;
    evidence: string;
  }[];
  followUpNeeded: boolean;
  suggestedFollowUp?: string;
}

export interface AssessmentConfig {
  adaptiveDifficulty: boolean;
  maxQuestions: number;
  timeLimit: number | null;
  allowedTopics: string[];
  vocabularyLevel: "technical" | "standard" | "simplified";
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  role?: "STUDENT" | "INSTRUCTOR";
}

export interface CourseFormData {
  code: string;
  title: string;
  description?: string;
  department?: string;
}

export interface LearningOutcomeFormData {
  code: string;
  title: string;
  description: string;
  category?: string;
  weight: number;
}
