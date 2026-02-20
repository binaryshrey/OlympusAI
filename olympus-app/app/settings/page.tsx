import { withAuth } from "@workos-inc/authkit-nextjs";
import DashboardLayout from "../components/DashboardLayout";

export default async function SettingsPage() {
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
    <DashboardLayout user={user} currentPage="settings">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>

        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 text-sm text-gray-500 font-mono">
                  {user.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Preferences
            </h2>
            <p className="text-sm text-gray-600">Customize your experience</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
