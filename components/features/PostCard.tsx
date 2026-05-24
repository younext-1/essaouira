"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, BadgeCheck, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { cn } from "@/lib/utils";

interface PostCardProps {
  author: string;
  avatar: string;
  isVerified?: boolean;
  location?: string;
  image: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  views: string;
  index: number;
}

export function PostCard({
  author,
  avatar,
  isVerified = false,
  location = "Essaouira, Morocco",
  image,
  title,
  description,
  category,
  tags,
  views,
  index,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    if (!isFollowing) {
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ["#C1440E", "#E8A020", "#2A9D8F"],
        origin: { y: 0.6 }
      });
    }
    setIsFollowing(!isFollowing);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <Card className="flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-video w-full overflow-hidden group bg-brand-soft-gray">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
          
          {/* Badges and Actions */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="shadow-lg backdrop-blur-md bg-white/90">
              {category}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <motion.button
              onClick={() => setIsSaved(!isSaved)}
              whileTap={{ scale: 0.8 }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <motion.div
                animate={{ rotateY: isSaved ? 180 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <Bookmark className={cn("w-5 h-5", isSaved && "fill-brand-saffron text-brand-saffron")} />
              </motion.div>
            </motion.button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Header Area */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={avatar} alt={author} size="md" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#18181B]">{author}</span>
                  {isVerified && <BadgeCheck className="w-4 h-4 text-brand-turquoise" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#18181B]/60">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleFollow}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-full spring-transition",
                isFollowing 
                  ? "bg-[#CA8A04] text-white" 
                  : "border-2 border-brand-dark-text/20 text-[#18181B] hover:border-brand-dark-text"
              )}
            >
              {isFollowing ? "Following ✓" : "Follow"}
            </button>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-display font-bold text-xl text-[#18181B] mb-2 leading-tight">
              {title}
            </h3>
            <p className="text-[#18181B]/80 text-sm line-clamp-3 leading-relaxed mb-3">
              {description}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs bg-brand-soft-gray/50 border-none text-[#18181B]/70">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-soft-gray">
            <div className="flex items-center gap-5">
              <motion.button
                onClick={() => setIsLiked(!isLiked)}
                whileTap={{ scale: 0.8 }}
                className="flex items-center gap-1.5 text-[#18181B]/70 hover:text-brand-rose transition-colors"
              >
                <motion.div
                  animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn("w-6 h-6", isLiked && "fill-brand-rose text-brand-rose")} />
                </motion.div>
                <span className="text-sm font-medium">{isLiked ? "2.4k" : "2.3k"}</span>
              </motion.button>
              
              <button className="flex items-center gap-1.5 text-[#18181B]/70 hover:text-brand-deep-ocean transition-colors">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">128</span>
              </button>
              
              <button className="flex items-center gap-1.5 text-[#18181B]/70 hover:text-brand-deep-ocean transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 text-[#18181B]/50">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{views}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
