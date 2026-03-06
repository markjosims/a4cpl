import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Initialize AI clients (lazy initialization for serverless)
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

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

export interface EvaluationResult {
  outcomeCode: string;
  score: number; // 0-100
  proficiencyLevel: "Mastery" | "Proficient" | "Developing" | "Beginning" | "Not Demonstrated";
  evidence: string[];
  feedback: string;
}

export interface AssessmentResponse {
  message: string;
  questionType: "scenario" | "follow_up" | "clarification" | "summary";
  targetOutcomes: string[]; // Learning outcome codes being assessed
  evaluations?: EvaluationResult[];
  isComplete?: boolean;
}

// System prompt for CPL assessment
export function buildAssessmentSystemPrompt(context: AssessmentContext): string {
  const outcomesText = context.learningOutcomes
    .map((lo) => `- ${lo.code}: ${lo.title}\n  ${lo.description}`)
    .join("\n");

  return `You are an AI assessment assistant helping evaluate Credit for Prior Learning (CPL) for the course "${context.courseTitle}" (${context.courseCode}).

## Your Role
You are conducting an adaptive, conversational assessment to determine if the participant has knowledge and skills equivalent to completing this course. Your goal is to fairly and accurately assess their competencies while being sensitive to diverse backgrounds and communication styles.

## Course Learning Outcomes to Assess
${outcomesText}

## Participant Background
${context.userBackground.experienceType ? `- Experience Type: ${context.userBackground.experienceType}` : ""}
${context.userBackground.yearsExperience ? `- Years of Experience: ${context.userBackground.yearsExperience}` : ""}
${context.userBackground.certifications?.length ? `- Certifications: ${context.userBackground.certifications.join(", ")}` : ""}

## Assessment Guidelines

### Equity and Accessibility
1. Adapt your vocabulary to match the participant's communication style
2. Accept equivalent terminology (e.g., "backfire" vs "burnout operation")
3. Focus on demonstrated understanding, not academic vocabulary
4. Use scenario-based questions that relate to real-world experience
5. Ask clarifying questions when responses are ambiguous rather than assuming lack of knowledge

### Question Types
1. **Scenario Questions**: Present realistic firefighting situations requiring application of knowledge
2. **Follow-up Questions**: Probe deeper based on previous responses
3. **Clarification Questions**: Ask for more detail when understanding is unclear
4. **Summary Questions**: Confirm understanding of a topic area before moving on

### Evaluation Criteria
For each learning outcome, assess proficiency on this scale:
- **Mastery (90-100)**: Comprehensive understanding with ability to apply in complex situations
- **Proficient (75-89)**: Solid understanding with reliable application in standard situations
- **Developing (60-74)**: Basic understanding with some gaps in application
- **Beginning (40-59)**: Limited understanding requiring significant development
- **Not Demonstrated (0-39)**: Insufficient evidence of knowledge or skills

### Response Format
Always respond conversationally as if speaking with the participant. Do not expose internal scoring or technical assessment details to the participant.

Remember: Your goal is to give participants the best opportunity to demonstrate their knowledge and skills, regardless of their formal education background.`;
}

// Generate assessment question using Claude
export async function generateAssessmentQuestion(
  context: AssessmentContext,
  conversationHistory: AIMessage[],
  targetOutcomes?: string[]
): Promise<AssessmentResponse> {
  const client = getAnthropicClient();
  const systemPrompt = buildAssessmentSystemPrompt(context);

  const messages = conversationHistory.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  // Add instruction for generating next question
  const instructionMessage =
    messages.length === 0
      ? "Begin the assessment with a welcoming introduction and an initial scenario-based question."
      : targetOutcomes?.length
      ? `Continue assessing. Focus on these learning outcomes: ${targetOutcomes.join(", ")}. Ask a follow-up or new scenario question.`
      : "Based on the conversation so far, ask an appropriate follow-up question or move to assess a new learning outcome.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...messages,
      {
        role: "user",
        content: `[SYSTEM INSTRUCTION - NOT FROM PARTICIPANT]: ${instructionMessage}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  return {
    message: content.text,
    questionType: messages.length === 0 ? "scenario" : "follow_up",
    targetOutcomes: targetOutcomes || [],
  };
}

// Evaluate a participant's response
export async function evaluateResponse(
  context: AssessmentContext,
  conversationHistory: AIMessage[],
  response: string
): Promise<{
  evaluation: EvaluationResult[];
  feedback: string;
  suggestFollowUp: boolean;
  followUpReason?: string;
}> {
  const client = getAnthropicClient();

  const evaluationPrompt = `You are evaluating a participant's response in a CPL assessment.

## Course: ${context.courseTitle} (${context.courseCode})

## Learning Outcomes
${context.learningOutcomes.map((lo) => `- ${lo.code}: ${lo.title}`).join("\n")}

## Conversation History
${conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

## Latest Response to Evaluate
${response}

## Task
Analyze the response and provide:
1. Which learning outcomes are demonstrated (if any)
2. Score and proficiency level for each demonstrated outcome
3. Specific evidence from the response
4. Whether follow-up questions are needed
5. Brief internal feedback (not shown to participant)

Respond in JSON format:
{
  "evaluations": [
    {
      "outcomeCode": "LO1",
      "score": 85,
      "proficiencyLevel": "Proficient",
      "evidence": ["specific quote or paraphrase from response"],
      "feedback": "internal assessment notes"
    }
  ],
  "overallFeedback": "summary of response quality",
  "suggestFollowUp": true/false,
  "followUpReason": "why follow-up is needed (if applicable)"
}`;

  const aiResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: evaluationPrompt,
      },
    ],
  });

  const content = aiResponse.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);
    return {
      evaluation: parsed.evaluations || [],
      feedback: parsed.overallFeedback || "",
      suggestFollowUp: parsed.suggestFollowUp ?? true,
      followUpReason: parsed.followUpReason,
    };
  } catch {
    // If parsing fails, return a default evaluation
    return {
      evaluation: [],
      feedback: "Unable to parse evaluation",
      suggestFollowUp: true,
      followUpReason: "Evaluation parsing failed, need to continue assessment",
    };
  }
}

// Generate final assessment summary and CPL recommendation
export async function generateAssessmentSummary(
  context: AssessmentContext,
  conversationHistory: AIMessage[],
  evaluations: EvaluationResult[]
): Promise<{
  overallScore: number;
  recommendation: "AWARD_CREDIT" | "PARTIAL_CREDIT" | "NO_CREDIT" | "NEEDS_REASSESSMENT";
  strengths: string[];
  areasForGrowth: string[];
  studyGuide: string;
  summary: string;
}> {
  const client = getAnthropicClient();

  const summaryPrompt = `Generate a final CPL assessment summary.

## Course: ${context.courseTitle} (${context.courseCode})

## Learning Outcomes Evaluated
${context.learningOutcomes.map((lo) => `- ${lo.code}: ${lo.title}`).join("\n")}

## Evaluation Results
${JSON.stringify(evaluations, null, 2)}

## Task
Provide a comprehensive summary including:
1. Overall score (weighted average based on outcome importance)
2. CPL recommendation (AWARD_CREDIT if score >= 70, PARTIAL_CREDIT if 50-69, NO_CREDIT if < 50, or NEEDS_REASSESSMENT if insufficient data)
3. Specific strengths demonstrated
4. Areas for growth/improvement
5. Personalized study guide for any gaps
6. Brief summary suitable for showing to the participant

Respond in JSON format:
{
  "overallScore": 75,
  "recommendation": "AWARD_CREDIT",
  "strengths": ["strength 1", "strength 2"],
  "areasForGrowth": ["area 1", "area 2"],
  "studyGuide": "Detailed study recommendations...",
  "summary": "Participant-facing summary..."
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: summaryPrompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  try {
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    return JSON.parse(jsonText);
  } catch {
    return {
      overallScore: 0,
      recommendation: "NEEDS_REASSESSMENT",
      strengths: [],
      areasForGrowth: [],
      studyGuide: "Unable to generate study guide",
      summary: "Assessment could not be completed. Please contact an administrator.",
    };
  }
}
