import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StartAssessmentButton } from "@/components/start-assessment-button";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { id } = await params;

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      course: {
        include: { learningOutcomes: { orderBy: { code: "asc" } } },
      },
    },
  });

  if (!assessment || assessment.status !== "PUBLISHED") {
    notFound();
  }

  // Check for existing session
  const existingSession = userId
    ? await db.assessmentSession.findFirst({
        where: { assessmentId: id, userId, status: "IN_PROGRESS" },
      })
    : null;

  const completedSession = userId
    ? await db.assessmentSession.findFirst({
        where: { assessmentId: id, userId, status: "COMPLETED" },
        include: { result: true },
      })
    : null;

  const outcomes = assessment.course.learningOutcomes;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/assessments"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          &larr; Back to Assessments
        </Link>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">{assessment.course.code}</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {assessment.title}
          </h1>
          {assessment.description && (
            <p className="mt-2 text-gray-600">{assessment.description}</p>
          )}
        </div>

        {assessment.timeLimit && (
          <p className="text-sm text-gray-500">
            Time limit: {assessment.timeLimit} minutes
          </p>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Learning Outcomes
          </h2>
          <div className="space-y-3">
            {outcomes.map((lo) => (
              <div
                key={lo.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex-shrink-0">
                    {lo.code}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{lo.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {lo.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed session result */}
        {completedSession?.result && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Your Result
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Score: {completedSession.result.overallScore.toFixed(1)}% |
                Recommendation:{" "}
                {completedSession.result.cplRecommendation
                  .replace(/_/g, " ")
                  .toLowerCase()}
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        {!completedSession && (
          <div className="border-t pt-4">
            <StartAssessmentButton
              assessmentId={id}
              existingSessionId={existingSession?.id}
              label={existingSession ? "Continue Assessment" : "Start Assessment"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
