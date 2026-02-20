"use client";

import Link from "next/link";
import Image from "next/image";
import {
  RiHome6Line,
  RiUserSmileLine,
  RiLogoutCircleRLine,
} from "@remixicon/react";
import { useState, useRef, useEffect } from "react";
import { handleSignOut } from "../actions/auth";

interface ProfileMenuProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profilePictureUrl?: string | null;
  };
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none"
      >
        <Image
          className="h-8 w-8 rounded-full cursor-pointer "
          src={user?.profilePictureUrl || "/logo.svg"}
          alt="Profile"
          width={32}
          height={32}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="flex items-center gap-3 p-3 border-b border-gray-200">
            <Image
              className="h-8 w-8 rounded-full"
              src={user?.profilePictureUrl || "/logo.svg"}
              alt="Profile"
              width={32}
              height={32}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || "User"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <RiUserSmileLine className="h-4 w-4" />
              <span>Profile</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <RiHome6Line className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="border-t border-gray-200 py-1">
            <form action={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <RiLogoutCircleRLine className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
