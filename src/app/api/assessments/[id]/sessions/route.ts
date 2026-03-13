import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assessmentId } = await params;

    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Assessment is not available" }, { status: 400 });
    }

    // Check for existing in-progress session
    const existing = await db.assessmentSession.findFirst({
      where: {
        assessmentId,
        userId: session.user.id,
        status: "IN_PROGRESS",
      },
    });

    if (existing) {
      return NextResponse.json({ session: existing }, { status: 200 });
    }

    const newSession = await db.assessmentSession.create({
      data: {
        assessmentId,
        userId: session.user.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
