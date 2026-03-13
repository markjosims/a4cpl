import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const assessmentSession = await db.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        interactions: { orderBy: { sequence: "asc" } },
        assessment: {
          include: {
            course: { include: { learningOutcomes: true } },
          },
        },
      },
    });

    if (!assessmentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (assessmentSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session: assessmentSession });
  } catch (error) {
    console.error("Fetch session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
