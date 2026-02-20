import { withAuth } from "@workos-inc/authkit-nextjs";
import DashboardLayout from "../components/DashboardLayout";

export default async function SupportPage() {
  const { user } = await withAuth();

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Not signed in</h1>
        <p>You should have been redirected. Try going back to the homepage.</p>
      </main>
    );
  }

  return (
    <DashboardLayout user={user} currentPage="support">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Support</h1>
        <p className="mt-2 text-gray-600">
          Get help with your account and questions
        </p>

        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  How do I start a new project?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Navigate to the Dashboard and click on "+ New Project" to
                  begin the onboarding process.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  How do I access my files?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Go to the Files page from the sidebar to view and manage all
                  your project files.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Can I customize my profile?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Yes! Click on your profile picture at the bottom of the
                  sidebar to access your profile settings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Contact Support
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Need additional help? Reach out to our support team.
            </p>
            <a
              href="https://github.com/binaryshrey/IBM-Nebula-Orchesty-AI/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
            >
              Open GitHub Issue
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
