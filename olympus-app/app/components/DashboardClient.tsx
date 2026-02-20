"use client";

import Link from "next/link";
import { TrendingUp, CheckCircle, Clock, Activity } from "lucide-react";

interface DashboardClientProps {
  greeting: string;
  formattedDate: string;
  userName: string;
}

export default function DashboardClient({
  greeting,
  formattedDate,
  userName,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{formattedDate}</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {greeting}, {userName}!
          </h1>
        </div>
        <Link href="/onboard">
          <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
            + New Project
          </button>
        </Link>
      </div>

      <hr className="border-gray-200" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Projects
            </h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-900 text-3xl font-bold">0</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Completed</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-gray-900 text-3xl font-bold">0</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">In Progress</h3>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-900 text-3xl font-bold">0</p>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">This Week</h3>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-900 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">No recent activity</p>
            <Link href="/onboard">
              <button className="mt-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
