import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AssessmentsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const assessments = await db.assessment.findMany({
    where: { status: "PUBLISHED" },
    include: {
      course: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  // Get user's sessions for status display
  const userSessions = userId
    ? await db.assessmentSession.findMany({
        where: { userId },
        select: { id: true, assessmentId: true, status: true },
      })
    : [];

  const sessionByAssessment = new Map(
    userSessions.map((s) => [s.assessmentId, s])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CPL Assessments</h1>
        <p className="mt-1 text-gray-600">
          Demonstrate your knowledge and skills to earn college credit.
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No assessments are currently available.
        </div>
      ) : (
        <div className="grid gap-4">
          {assessments.map((assessment) => {
            const userSession = sessionByAssessment.get(assessment.id);
            return (
              <div key={assessment.id} className="card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {assessment.course.code}: {assessment.title}
                      </h3>
                      <StatusBadge status={userSession?.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {assessment.description}
                    </p>
                    {assessment.timeLimit && (
                      <p className="text-xs text-gray-400 mt-1">
                        Time limit: {assessment.timeLimit} minutes
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/assessments/${assessment.id}`}
                    className="btn-primary ml-4"
                  >
                    {userSession?.status === "IN_PROGRESS"
                      ? "Continue"
                      : userSession?.status === "COMPLETED"
                        ? "View Results"
                        : "View Details"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
        Not Started
      </span>
    );
  }
  switch (status) {
    case "IN_PROGRESS":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          In Progress
        </span>
      );
    case "COMPLETED":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          Completed
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}
