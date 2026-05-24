"use client";

import { motion } from "framer-motion";
import { Avatar } from "../ui/Avatar";
import { Plus } from "lucide-react";

export function StoryReel() {
  const stories = [
    { id: 1, name: "Fatima", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop", hasStory: true },
    { id: 2, name: "Hassan", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop", hasStory: true },
    { id: 3, name: "Aicha", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop", hasStory: false },
    { id: 4, name: "Youssef", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop", hasStory: true },
  ];

  return (
    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar py-4 px-1">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-2 cursor-pointer shrink-0">
        <div className="relative w-16 h-16 rounded-full border-2 border-brand-dark-text/10 flex items-center justify-center text-brand-deep-ocean hover:border-brand-saffron transition-colors">
          <Plus className="w-8 h-8" />
        </div>
        <span className="text-xs font-medium text-[#18181B]">Your Story</span>
      </div>

      {/* Stories */}
      {stories.map((story, i) => (
        <motion.div 
          key={story.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group"
        >
          <div className={`relative p-1 rounded-full ${story.hasStory ? "bg-gradient-to-tr from-brand-saffron via-brand-terracotta to-brand-rose" : "bg-transparent"}`}>
            <div className="bg-brand-off-white rounded-full p-0.5">
              <Avatar src={story.image} alt={story.name} size="lg" className="group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <span className="text-xs font-medium text-[#18181B]">{story.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
