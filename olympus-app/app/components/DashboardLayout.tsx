"use client";

import Link from "next/link";
import Image from "next/image";
import {
  RiHome6Fill,
  RiFolder2Fill,
  RiSettingsFill,
  RiQuestionFill,
} from "@remixicon/react";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardLayout({
  children,
  user,
  currentPage,
}: DashboardLayoutProps) {
  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: RiHome6Fill,
      current: currentPage === "dashboard",
    },
    {
      name: "Files",
      href: "/files",
      icon: RiFolder2Fill,
      current: currentPage === "files",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: RiSettingsFill,
      current: currentPage === "settings",
    },
    {
      name: "Support",
      href: "/support",
      icon: RiQuestionFill,
      current: currentPage === "support",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4">
              <Image
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Nebula AI"
                width={32}
                height={32}
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Nebula AI
              </span>
            </div>
            <div className="mt-5 flex-1 flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    )}
                  >
                    <item.icon
                      className={classNames(
                        item.current
                          ? "text-gray-900"
                          : "text-gray-400 group-hover:text-gray-500",
                        "mr-3 flex-shrink-0 h-6 w-6",
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            {/* User Profile */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Link
                href="/profile"
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div>
                    <Image
                      className="inline-block h-9 w-9 rounded-full"
                      src={user?.profilePictureUrl || "/logo.svg"}
                      alt={user?.firstName || "User"}
                      width={36}
                      height={36}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      View profile
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
