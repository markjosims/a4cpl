import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";

// Initialize AI client (lazy initialization for serverless)
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Type definitions for AI interactions
export interface AssessmentContext {
  courseCode: string;
  courseTitle: string;
  learningOutcomes: {
    code: string;
    title: string;
    description: string;
  }[];
  userBackground: {
    experienceType?: string;
    yearsExperience?: number;
    certifications?: string[];
  };
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssessmentResponse {
  message: string;
  questionType: "scenario" | "follow_up" | "clarification" | "summary";
  targetOutcomes: string[]; // Learning outcome codes being assessed
  isComplete?: boolean;
}

// Load prompt templates from JSON file
function loadPromptTemplates(): Record<string, string> {
  const promptPath = join(process.cwd(), "prompts", "assessment.json");
  const raw = readFileSync(promptPath, "utf-8");
  return JSON.parse(raw);
}

// System prompt for CPL assessment
export function buildAssessmentSystemPrompt(context: AssessmentContext): string {
  const templates = loadPromptTemplates();

  const outcomesText = context.learningOutcomes
    .map((lo) => `- ${lo.code}: ${lo.title}\n  ${lo.description}`)
    .join("\n");

  const backgroundLines = [
    context.userBackground.experienceType
      ? `- Experience Type: ${context.userBackground.experienceType}`
      : "",
    context.userBackground.yearsExperience
      ? `- Years of Experience: ${context.userBackground.yearsExperience}`
      : "",
    context.userBackground.certifications?.length
      ? `- Certifications: ${context.userBackground.certifications.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return templates.systemPrompt
    .replace("{{courseTitle}}", context.courseTitle)
    .replace("{{courseCode}}", context.courseCode)
    .replace("{{outcomesText}}", outcomesText)
    .replace("{{backgroundText}}", backgroundLines);
}

// Generate assessment question using OpenAI
export async function generateAssessmentQuestion(
  context: AssessmentContext,
  conversationHistory: AIMessage[],
  targetOutcomes?: string[]
): Promise<AssessmentResponse> {
  const client = getOpenAIClient();
  const systemPrompt = buildAssessmentSystemPrompt(context);
  const templates = loadPromptTemplates();

  const messages: OpenAI.ChatCompletionMessageParam[] = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Build instruction from templates
  let instruction: string;
  if (messages.length === 0) {
    instruction = templates.initialInstruction;
  } else if (targetOutcomes?.length) {
    instruction = templates.continueWithFocusInstruction.replace(
      "{{targetOutcomes}}",
      targetOutcomes.join(", ")
    );
  } else {
    instruction = templates.continueInstruction;
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
      {
        role: "user",
        content: `[SYSTEM INSTRUCTION - NOT FROM PARTICIPANT]: ${instruction}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Unexpected empty response from AI");
  }

  return {
    message: content,
    questionType: messages.length === 0 ? "scenario" : "follow_up",
    targetOutcomes: targetOutcomes || [],
  };
}
