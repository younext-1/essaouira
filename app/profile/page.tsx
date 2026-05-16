import { User } from "lucide-react";

export default function Profile() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-200">
        <User className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-display-xl font-bold text-[#1a1a2e] mb-2">My Profile</h2>
      <p className="text-[#1a1a2e]/70 max-w-md">
        We are crafting your personal Mogador experience. Check back soon to set up your preferences, saved places, and interactions.
      </p>
      <div className="mt-8 px-6 py-2 bg-gray-100 text-[#1a1a2e] rounded-full font-medium border border-gray-200 inline-block shadow-sm">
        Coming Soon
      </div>
    </div>
  );
}
