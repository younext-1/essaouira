"use client";

import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileRedirect() {
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || loading) return;

    if (isSignedIn && profile?.username) {
      router.replace(`/profile/${profile.username}`);
    } else if (isSignedIn && profile) {
      router.replace(`/profile/${profile.id}`);
    } else {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, profile, loading, router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
    </div>
  );
}
