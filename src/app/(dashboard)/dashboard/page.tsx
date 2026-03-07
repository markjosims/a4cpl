import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  // Fetch relevant data based on role
  const assessments = await db.assessment.findMany({
    where: { status: "PUBLISHED" },
    include: {
      course: true,
      _count: { select: { sessions: true } },
    },
  });

  // For students, get their assessment sessions
  let userSessions: any[] = [];
  if (user?.id) {
    userSessions = await db.assessmentSession.findMany({
      where: { userId: user.id },
      include: {
        assessment: { include: { course: true } },
        result: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-1 text-gray-600">
          {isInstructor
            ? "Manage courses, assessments, and review student results."
            : "Continue your CPL assessment journey."}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Available Assessments"
          value={assessments.length}
          description="CPL assessments you can take"
          href="/dashboard/assessments"
        />
        <StatCard
          title="In Progress"
          value={userSessions.filter((s) => s.status === "IN_PROGRESS").length}
          description="Assessments started"
          href="/dashboard/assessments"
        />
        <StatCard
          title="Completed"
          value={userSessions.filter((s) => s.status === "COMPLETED").length}
          description="Assessments finished"
          href="/dashboard/assessments"
        />
      </div>

      {/* Available Assessments */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Available CPL Assessments
          </h2>
          <Link
            href="/dashboard/assessments"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-4">
          {assessments.length === 0 ? (
            <div className="card p-6 text-center text-gray-500">
              No assessments available yet.
            </div>
          ) : (
            assessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                userSession={userSessions.find(
                  (s) => s.assessmentId === assessment.id
                )}
              />
            ))
          )}
        </div>
      </section>

      {/* Recent Activity for Students */}
      {!isInstructor && userSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Recent Activity
          </h2>
          <div className="card divide-y">
            {userSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {session.assessment.course.code}: {session.assessment.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{session.status.toLowerCase().replace("_", " ")}</span>
                    {session.result && (
                      <span className="ml-2">
                        | {session.result.cplRecommendation.replace("_", " ")}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={"/dashboard/assessments/" + session.assessmentId}
                  className="btn-outline text-sm"
                >
                  {session.status === "COMPLETED" ? "View Results" : "Continue"}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instructor Quick Actions */}
      {isInstructor && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Manage Courses"
              description="Add or edit course content"
              href="/dashboard/courses"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <QuickActionCard
              title="Review Results"
              description="Validate AI assessments"
              href="/dashboard/review"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
            <QuickActionCard
              title="View Analytics"
              description="Assessment performance data"
              href="/dashboard/analytics"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <QuickActionCard
              title="Feedback"
              description="View user feedback"
              href="/dashboard/feedback"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="card p-6 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </Link>
  );
}

function AssessmentCard({
  assessment,
  userSession,
}: {
  assessment: any;
  userSession?: any;
}) {
  const getStatusBadge = () => {
    if (!userSession) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          Not Started
        </span>
      );
    }
    switch (userSession.status) {
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
            {userSession.status}
          </span>
        );
    }
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              {assessment.course.code}: {assessment.title}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 mt-1">{assessment.description}</p>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>{assessment.course.credits} credits</span>
            <span>Type: {assessment.type}</span>
            {assessment.timeLimit && (
              <span>Time limit: {assessment.timeLimit} min</span>
            )}
          </div>
        </div>
        <Link
          href={"/dashboard/assessments/" + assessment.id}
          className="btn-primary ml-4"
        >
          {userSession?.status === "IN_PROGRESS"
            ? "Continue"
            : userSession?.status === "COMPLETED"
            ? "View Results"
            : "Start Assessment"}
        </Link>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
    >
      <div className="text-primary-600">{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
