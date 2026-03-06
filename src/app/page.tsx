import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              AI-Assisted Assessment for
              <span className="block text-fire-400">
                Credit for Prior Learning
              </span>
            </h1>
            <p className="mt-6 text-xl text-primary-100 max-w-3xl mx-auto">
              Demonstrate your firefighting expertise and earn college credit
              through our adaptive AI assessment platform. Designed for
              experienced firefighters, veterans, and CDCR Fire Camp
              participants.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn-primary bg-fire-500 hover:bg-fire-600 text-lg px-8 py-3"
              >
                Start Your Assessment
              </Link>
              <Link
                href="/login"
                className="btn-outline border-white text-white hover:bg-white/10 text-lg px-8 py-3"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our AI-powered assessment adapts to your experience and background
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Adaptive Assessment"
              description="The AI adapts questions based on your responses, focusing on demonstrating your actual knowledge regardless of formal terminology."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
              title="Fair & Equitable"
              description="Designed to recognize skills from diverse backgrounds - CalFire veterans, military firefighters, CDCR Fire Camp participants, and more."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              title="Earn Real Credit"
              description="Successful completion can lead to college credit for FIRETEK 217: Wildland Fire Control at ELAC and transferable credits statewide."
            />
          </div>
        </div>
      </section>

      {/* Course Info Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                FIRETEK 217: Wildland Fire Control
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                This assessment evaluates your knowledge and skills in wildland
                fire characteristics, behavior, and management - aligned with
                East Los Angeles College&apos;s Fire Technology program.
              </p>
              <ul className="mt-8 space-y-4">
                <LearningOutcomeItem text="Understand wildfire behavior and spread patterns" />
                <LearningOutcomeItem text="Apply fire suppression tactics and safety protocols" />
                <LearningOutcomeItem text="Demonstrate knowledge of equipment and tools" />
                <LearningOutcomeItem text="Explain incident command structures" />
                <LearningOutcomeItem text="Assess terrain, weather, and fuel conditions" />
              </ul>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="card p-8 bg-white">
                <h3 className="text-xl font-semibold text-gray-900">
                  Who Should Apply?
                </h3>
                <ul className="mt-6 space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    Active or retired firefighters
                  </li>
                  <li className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    Military veterans with firefighting experience
                  </li>
                  <li className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    CDCR Conservation (Fire) Camp participants
                  </li>
                  <li className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    Volunteer firefighters with wildland experience
                  </li>
                  <li className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    Forest service and park service personnel
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register"
                    className="btn-primary w-full justify-center"
                  >
                    Begin Assessment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wider mb-8">
            A collaboration between
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            <div className="text-center">
              <p className="font-semibold text-gray-900">LACCD</p>
              <p className="text-sm text-gray-500">
                Los Angeles Community College District
              </p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">UC San Diego</p>
              <p className="text-sm text-gray-500">
                Laboratory for Emerging Intelligence
              </p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">ELAC</p>
              <p className="text-sm text-gray-500">
                East Los Angeles College Fire Technology
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">A4CPL</p>
            <p className="mt-2 text-sm">
              AI-Assisted Assessment to Award Credit for Prior Learning
            </p>
            <p className="mt-4 text-xs">
              Supported by the California Community Colleges AI FAST Challenge
            </p>
            <div className="mt-6 flex justify-center space-x-6 text-sm">
              <Link href="/accessibility" className="hover:text-white">
                Accessibility
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}

function LearningOutcomeItem({ text }: { text: string }) {
  return (
    <li className="flex items-start">
      <svg
        className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}
