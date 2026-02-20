import { withAuth } from "@workos-inc/authkit-nextjs";
import DashboardLayout from "../components/DashboardLayout";

export default async function FilesPage() {
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
    <DashboardLayout user={user} currentPage="files">
      <div className="px-4 pb-6">
        <div className="bg-white mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Files</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage your project files and documents.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">No files yet</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
