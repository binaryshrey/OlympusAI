import { withAuth } from "@workos-inc/authkit-nextjs";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";
import { signOut } from "@workos-inc/authkit-nextjs";

export default async function ProfilePage() {
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
    <DashboardLayout user={user} currentPage="profile">
      <div className="bg-white shadow -m-1 -mx-1 sm:-mx-1 md:-mx-1 -my-3 overflow-x-hidden">
        {/* Header Background */}
        <div className="relative h-64 bg-gradient-to-r from-blue-500 to-blue-600"></div>

        {/* Profile Content */}
        <div className="relative px-8 pb-8 max-w-7xl mx-auto min-h-screen">
          {/* Profile Image */}
          <div className="absolute -top-40 left-8">
            <div className="relative">
              <Image
                className="rounded-full border-4 border-white shadow-lg"
                src={user?.profilePictureUrl || "/logo.svg"}
                alt={user?.firstName || "User"}
                width={160}
                height={160}
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-28">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.email?.split("@")[0]}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </div>

            {/* Profile Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">
                    {user.email}
                  </span>
                </div>
                {user.firstName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Name:</span>
                    <span className="font-medium text-gray-900">
                      {user.firstName}
                    </span>
                  </div>
                )}
                {user.lastName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Name:</span>
                    <span className="font-medium text-gray-900">
                      {user.lastName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {user.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
