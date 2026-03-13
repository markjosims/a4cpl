import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getAnthropicClient, buildAssessmentSystemPrompt } from "@/lib/ai";

const interactSchema = z.object({
  response: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { response: userResponse } = interactSchema.parse(body);

    // Fetch session with assessment context
    const assessmentSession = await db.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        interactions: { orderBy: { sequence: "asc" } },
        assessment: {
          include: {
            course: { include: { learningOutcomes: true } },
          },
        },
        user: { include: { profile: true } },
      },
    });

    if (!assessmentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (assessmentSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (assessmentSession.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Session is not in progress" }, { status: 400 });
    }

    const isStart = userResponse === "__START__";
    const interactions = assessmentSession.interactions;

    // Save student response to the latest interaction (if not starting)
    if (!isStart && interactions.length > 0) {
      const latestInteraction = interactions[interactions.length - 1];
      if (!latestInteraction.response) {
        await db.interaction.update({
          where: { id: latestInteraction.id },
          data: { response: userResponse },
        });
      }
    }

    // Build conversation history for AI
    const conversationHistory: { role: "user" | "assistant"; content: string }[] = [];
    for (const interaction of interactions) {
      conversationHistory.push({ role: "assistant", content: interaction.prompt });
      if (interaction.response) {
        conversationHistory.push({ role: "user", content: interaction.response });
      }
    }

    // Add the current user response if not start and not already in history
    if (!isStart && interactions.length > 0) {
      const last = interactions[interactions.length - 1];
      if (!last.response) {
        conversationHistory.push({ role: "user", content: userResponse });
      }
    }

    // Build assessment context
    const course = assessmentSession.assessment.course;
    const profile = assessmentSession.user.profile;
    const certifications = profile?.certifications
      ? JSON.parse(profile.certifications)
      : undefined;

    const systemPrompt = buildAssessmentSystemPrompt({
      courseCode: course.code,
      courseTitle: course.title,
      learningOutcomes: course.learningOutcomes.map((lo) => ({
        code: lo.code,
        title: lo.title,
        description: lo.description,
      })),
      userBackground: {
        experienceType: profile?.experienceType ?? undefined,
        yearsExperience: profile?.yearsExperience ?? undefined,
        certifications,
      },
    });

    // Build messages for Claude
    const messages =
      conversationHistory.length === 0
        ? [
            {
              role: "user" as const,
              content:
                "[SYSTEM INSTRUCTION - NOT FROM PARTICIPANT]: Begin the assessment with a welcoming introduction and an initial scenario-based question.",
            },
          ]
        : [
            ...conversationHistory,
            {
              role: "user" as const,
              content: isStart
                ? "[SYSTEM INSTRUCTION - NOT FROM PARTICIPANT]: Begin the assessment with a welcoming introduction and an initial scenario-based question."
                : userResponse,
            },
          ];

    // Stream response from Claude
    const client = getAnthropicClient();
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const nextSequence = interactions.length + 1;

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullText += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Persist the AI response as a new interaction
          await db.interaction.create({
            data: {
              sessionId,
              sequence: nextSequence,
              type: nextSequence === 1 ? "SCENARIO" : "FOLLOW_UP",
              prompt: fullText,
            },
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Interact error:", error);
    return NextResponse.json(
      { error: "Failed to process interaction" },
      { status: 500 }
    );
  }
}
