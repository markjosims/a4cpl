import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { AssessmentChat } from "@/components/assessment-chat";
import Link from "next/link";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { id: assessmentId } = await params;

  if (!userId) {
    redirect("/login");
  }

  // Find the user's in-progress session for this assessment
  const assessmentSession = await db.assessmentSession.findFirst({
    where: {
      assessmentId,
      userId,
      status: "IN_PROGRESS",
    },
    include: {
      interactions: { orderBy: { sequence: "asc" } },
      assessment: { include: { course: true } },
    },
  });

  if (!assessmentSession) {
    // No active session — redirect to assessment detail page to start one
    redirect(`/dashboard/assessments/${assessmentId}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm text-gray-500">
            {assessmentSession.assessment.course.code}
          </p>
          <h1 className="font-semibold text-gray-900">
            {assessmentSession.assessment.title}
          </h1>
        </div>
        <Link
          href={`/dashboard/assessments/${assessmentId}`}
          className="btn-outline text-sm"
        >
          Exit
        </Link>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <AssessmentChat
          sessionId={assessmentSession.id}
          initialInteractions={assessmentSession.interactions}
        />
      </div>
    </div>
  );
}
