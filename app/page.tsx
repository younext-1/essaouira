"use client";

import { useState, useEffect } from "react";
import { DarkCard } from "@/components/ui/DarkCard";
import { GradientAvatar } from "@/components/ui/GradientAvatar";
import { PillFilter } from "@/components/ui/PillFilter";
import { GradientText } from "@/components/ui/GradientText";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import type { PostWithCounts, Profile } from "@/lib/database.types";

// Helper component for Image Fallback & Swipeable Gallery
function ImageGallery({ images, alt }: { images: string[], alt: string }) {
  const [error, setError] = useState(false);

  if (error || images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#2C2C2E] to-[#3A3A3C] flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-[#666]" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <Image 
        src={images[0]} 
        alt={alt} 
        fill 
        className="object-cover transition-transform duration-400 group-hover:scale-[1.03]" 
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
      {images.map((src, idx) => (
        <div key={idx} className="w-full h-full shrink-0 relative snap-center">
          <Image 
            src={src} 
            alt={`${alt} ${idx + 1}`} 
            fill 
            className="object-cover" 
            onError={() => setError(true)}
          />
        </div>
      ))}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded-[10px] text-white text-[10px] z-10 font-medium">
        1/{images.length}
      </div>
    </div>
  );
}

// Skeleton Loader Component
function SkeletonCard() {
  return (
    <div className="bg-dark-secondary rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.06] overflow-hidden w-full mb-[16px] md:mb-[20px]">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full animate-shimmer" />
          <div className="flex flex-col gap-2">
            <div className="w-24 h-3 rounded-full animate-shimmer" />
            <div className="w-16 h-2 rounded-full animate-shimmer" />
          </div>
        </div>
        <div className="w-16 h-8 rounded-[20px] animate-shimmer" />
      </div>
      <div className="w-full h-[240px] md:aspect-square animate-shimmer" />
      <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-5">
          <div className="w-6 h-6 rounded-full animate-shimmer" />
          <div className="w-6 h-6 rounded-full animate-shimmer" />
          <div className="w-6 h-6 rounded-full animate-shimmer" />
        </div>
        <div className="w-6 h-6 rounded-full animate-shimmer" />
      </div>
      <div className="px-4 pb-5 flex flex-col gap-2">
        <div className="w-3/4 h-4 rounded-full animate-shimmer" />
        <div className="w-full h-3 rounded-full animate-shimmer" />
        <div className="w-5/6 h-3 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

// Category filter mapping (Arabic label → DB category)
const categoryMap: Record<string, string> = {
  "All": "all",
  "🎨 Artisanss": "artisan",
  "🎵 Music": "music",
  "🏄 Surf": "surf",
  "🍜 Food": "food",
  "🏛️ Culture": "culture",
};

interface LocalPost {
  id: string;
  author_id: string;
  author: string;
  category: string | null;
  location: string | null;
  avatar: string;
  images: string[];
  title: string | null;
  description: string | null;
  tags: string[];
  likes: number;
  views: string;
  liked: boolean;
  saved: boolean;
  following: boolean;
}

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "🎨 Artisans", "🎵 Music", "🏄 Surf", "🍜 Food", "🏛️ Culture"];
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [stories, setStories] = useState<{ id: string; name: string; image: string }[]>([]);
  const [featured, setFeatured] = useState<{ id: string; title: string; category: string; image: string }[]>([]);
  
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const user = isSignedIn ? profile : null;

  // Fetch posts from Supabase
  const fetchPosts = async (category?: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const dbCategory = category ? categoryMap[category] || "all" : "all";
      
      let query = supabase
        .from("posts_with_counts")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbCategory && dbCategory !== "all") {
        query = query.eq("category", dbCategory);
      }

      const { data: postsData } = await query;

      // Get user's likes and bookmarks
      let likedIds: string[] = [];
      let savedIds: string[] = [];
      let followingIds: string[] = [];

      if (user) {
        const [likesRes, bookmarksRes, followsRes] = await Promise.all([
          supabase.from("likes").select("post_id").eq("user_id", user.id),
          supabase.from("bookmarks").select("post_id").eq("user_id", user.id),
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
        ]);
        likedIds = likesRes.data?.map((l: { post_id: string }) => l.post_id) ?? [];
        savedIds = bookmarksRes.data?.map((b: { post_id: string }) => b.post_id) ?? [];
        followingIds = followsRes.data?.map((f: { following_id: string }) => f.following_id) ?? [];
      }

      // Get images for each post
      const postIds = postsData?.map((p: PostWithCounts) => p.id) ?? [];
      const { data: allImages } = await supabase
        .from("post_images")
        .select("post_id, url")
        .in("post_id", postIds.length > 0 ? postIds : ["__none__"])
        .order("sort_order");

      const imageMap: Record<string, string[]> = {};
      allImages?.forEach((img: { post_id: string; url: string }) => {
        if (!imageMap[img.post_id]) imageMap[img.post_id] = [];
        imageMap[img.post_id].push(img.url);
      });

      const localPosts: LocalPost[] = (postsData as PostWithCounts[] ?? []).map((p) => ({
        id: p.id,
        author_id: p.author_id,
        author: p.full_name || p.username,
        category: p.category,
        location: p.location || p.author_location,
        avatar: p.avatar_url || "",
        images: imageMap[p.id] ?? (p.cover_image ? [p.cover_image] : []),
        title: p.title,
        description: p.content,
        tags: p.tags ?? [],
        likes: p.likes_count || 0,
        views: p.view_count > 1000 ? `${(p.view_count / 1000).toFixed(1)}k` : String(p.view_count),
        liked: likedIds.includes(p.id),
        saved: savedIds.includes(p.id),
        following: followingIds.includes(p.author_id),
      }));

      setPosts(localPosts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch featured & stories
  useEffect(() => {
    const fetchExtra = async () => {
      const supabase = createClient();

      // Featured posts
      const { data: featuredData } = await supabase
        .from("posts_with_counts")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(5);

      setFeatured(
        (featuredData as PostWithCounts[] ?? []).map((p) => ({
          id: p.id,
          title: p.title || "",
          category: p.category || "",
          image: p.cover_image || "",
        }))
      );

      // Stories (featured artisan profiles)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("is_artisan", true)
        .not("avatar_url", "is", null)
        .limit(6);

      setStories(
        (profiles as Profile[] ?? []).map((p) => ({
          id: p.id,
          name: p.full_name || p.username || "",
          image: p.avatar_url || "",
        }))
      );
    };

    fetchExtra();
  }, []);

  // Fetch posts on filter change
  useEffect(() => {
    fetchPosts(activeFilter);
  }, [activeFilter, user]);

  const toggleLike = async (id: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    
    if (!user) return;
    const supabase = createClient();
    const post = posts.find(p => p.id === id);
    if (post?.liked) {
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: user.id });
    }
  };

  const toggleSave = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
    
    if (!user) return;
    const supabase = createClient();
    const post = posts.find(p => p.id === id);
    if (post?.saved) {
      await supabase.from("bookmarks").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("bookmarks").insert({ post_id: id, user_id: user.id });
    }
  };

  const toggleFollow = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, following: !p.following } : p));
    
    if (!user) return;
    const supabase = createClient();
    if (post.following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", post.author_id);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: post.author_id });
    }
  };

  // Pull to refresh logic
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const controls = useAnimation();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0) {
      const y = e.touches[0].clientY;
      const dy = y - startY;
      if (dy > 0 && dy < 150) {
        setCurrentY(dy);
        controls.set({ y: dy * 0.4 });
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 60 && !isRefreshing) {
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setIsRefreshing(true);
      controls.start({ y: 50, transition: { type: "spring" } });
      
      fetchPosts(activeFilter).then(() => {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: "spring", bounce: 0.5 } });
      });
    } else {
      controls.start({ y: 0, transition: { type: "spring", bounce: 0.5 } });
    }
    setStartY(0);
    setCurrentY(0);
  };

  // Realtime subscription for likes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("posts-likes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        () => {
          // Refresh post counts when likes change
          fetchPosts(activeFilter);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter]);

  return (
    <div className="w-full min-h-full relative overflow-x-hidden" dir="rtl">
      
      {/* Pull To Refresh Indicator */}
      <motion.div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-10"
        style={{ y: useMotionValue(-60) }}
        animate={isRefreshing ? { y: 20 } : { y: -60 }}
      >
        <div className="w-10 h-10 bg-dark-elevated border border-white/10 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className={`w-5 h-5 text-accent-purple ${isRefreshing ? "animate-spin" : ""}`} />
        </div>
      </motion.div>

      <motion.div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        animate={controls}
        className="w-full flex flex-col px-0 md:px-4 py-4 max-w-[1200px] mx-auto pt-2 md:pt-4 pb-[80px] md:pb-20"
      >
        
        {/* Hero Banner */}
        <div className="w-full md:h-[220px] bg-gradient-to-br from-ocean to-seafoam relative mb-6 md:mb-8 md:rounded-[20px] overflow-hidden flex flex-col items-center justify-center text-center shadow-md py-10 md:py-0">
          <span className="text-white text-[13px] tracking-widest uppercase mb-1 drop-shadow-sm font-medium">🌊 Essaouira, Morocco</span>
          <h1 className="font-display text-white text-3xl md:text-[36px] font-bold mb-2 drop-shadow-md">Discover Mogador</h1>
          <p className="text-white/90 text-[14px] md:text-[15px] font-medium drop-shadow-sm max-w-[300px] md:max-w-none">Connect with local artisans & coastal culture</p>
          <div className="absolute bottom-0 w-full">
            <svg viewBox="0 0 1440 120" className="w-full h-auto translate-y-1 fill-warm-white" preserveAspectRatio="none">
              <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
            </svg>
          </div>
        </div>

        {/* Featured Section */}
        {featured.length > 0 && (
          <div className="mb-6 md:mb-8 w-full">
            <h2 className="text-[16px] font-bold mb-3 md:mb-4 flex items-center gap-2 px-4 md:px-0">
              <GradientText>⭐ مميز</GradientText>
            </h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory px-4 md:px-0">
              {featured.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative shrink-0 w-[200px] h-[120px] md:w-[260px] md:h-[140px] rounded-[16px] overflow-hidden group cursor-pointer snap-start"
                >
                  {item.image && <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-400 group-hover:scale-[1.05]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md border border-white/15 text-white text-[10px] md:text-[12px] font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-[20px]">
                    {item.category}
                  </div>
                  <h3 className="absolute bottom-3 right-4 text-white font-bold text-[13px] md:text-[15px]">{item.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stories */}
        {stories.length > 0 && (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 md:pb-6 w-full border-b border-white/5 mb-4 md:mb-6 px-4 md:px-0">
            {stories.map((story, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={story.id} 
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
              >
                <GradientAvatar src={story.image} alt={story.name} size={64} className="group-hover:scale-105 transition-transform" />
                <span className="bg-white border border-warm-border text-[11px] md:text-xs text-text-primary px-2 py-0.5 md:py-1 rounded-full">{story.name}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 md:pb-6 mb-2 px-4 md:px-0 snap-x snap-mandatory">
          {filters.map((filter) => (
            <div key={filter} className="snap-start shrink-0">
              <PillFilter 
                label={filter} 
                isActive={activeFilter === filter} 
                onClick={() => setActiveFilter(filter)} 
              />
            </div>
          ))}
        </div>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[20px] px-4 md:px-0">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-text-muted text-[16px]">لا توجد منشورات بعد</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                key={post.id}
                whileTap={{ scale: 0.98 }}
              >
                <DarkCard className="w-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3.5 md:p-4">
                    <div className="flex items-center gap-3">
                      <GradientAvatar src={post.avatar} alt={post.author} size={40} />
                      <div className="flex flex-col">
                        <h3 className="text-text-primary font-semibold md:font-bold text-[14px] md:text-[15px] leading-tight flex items-center gap-1.5">
                          {post.author}
                          <span className="w-2 h-2 rounded-full bg-seafoam flex-shrink-0"></span>
                        </h3>
                        <div className="text-text-muted text-[11px] md:text-[12px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {post.location} • 📍 5 min from Medina
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFollow(post.id); }}
                      className={`border-[1.5px] border-ocean rounded-[20px] px-3 md:px-[14px] py-1.5 md:py-[6px] text-[12px] md:text-[13px] font-medium transition-colors ${
                        post.following ? "bg-ocean text-white" : "text-ocean hover:bg-ocean hover:text-white"
                      }`}
                    >
                      {post.following ? "يتابع ✓" : "يتبع"}
                    </button>
                  </div>

                  {/* Image */}
                  <div className="relative w-full h-[240px] md:h-auto md:aspect-square bg-warm-sand overflow-hidden group">
                    <ImageGallery images={post.images} alt={post.title || ""} />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 bg-white/92 backdrop-blur-md border border-terracotta/20 text-terracotta text-[12px] font-medium px-[12px] py-[4px] rounded-[20px] z-10 pointer-events-none shadow-sm">
                      {post.category}
                    </div>

                    {/* View stats overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-black/70 to-transparent flex items-end p-4 pointer-events-none z-10">
                      <div className="flex items-center gap-1.5 text-white text-[12px] font-medium">
                        ⭐ 4.9
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between p-2 md:p-4 border-t border-warm-border">
                    <div className="flex items-center gap-2 md:gap-5 text-text-muted">
                      <motion.button 
                        whileTap={{ scale: [1, 1.4, 1] }} 
                        transition={{ duration: 0.3 }}
                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                        className="flex items-center gap-1.5 hover:text-saffron transition-colors group/heart min-w-[44px] min-h-[44px] justify-center"
                      >
                        <Heart className={`w-[22px] h-[22px] transition-transform group-hover/heart:scale-110 ${post.liked ? "fill-saffron text-saffron" : ""}`} />
                        <span className={`text-[14px] font-medium ${post.liked ? "text-saffron" : ""}`}>{post.likes}</span>
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 1.2 }} 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-ocean transition-colors group/btn min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <MessageCircle className="w-[22px] h-[22px] transition-transform group-hover/btn:scale-110" />
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 1.2 }} 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-ocean transition-colors group/btn min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Share2 className="w-[22px] h-[22px] transition-transform group-hover/btn:scale-110" />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 1.2 }} 
                      onClick={(e) => { e.stopPropagation(); toggleSave(post.id); }} 
                      className="hover:text-terracotta transition-colors group/btn min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Bookmark className={`w-[22px] h-[22px] transition-transform group-hover/btn:scale-110 ${post.saved ? "fill-terracotta text-terracotta" : ""}`} />
                    </motion.button>
                  </div>

                  {/* Content */}
                  <div className="px-3.5 md:px-4 pb-4 md:pb-5">
                    {post.likes > 100 && (
                      <div className="inline-block bg-[#E8A020]/12 text-saffron text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2">
                        🌟 Popular with visitors
                      </div>
                    )}
                    <h4 className="text-text-primary font-bold mb-1 md:mb-1.5 text-[14px] md:text-[15px]">{post.title}</h4>
                    <p className="text-text-secondary text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.7] mb-2.5 md:mb-3">{post.description}</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[44px] overflow-hidden md:max-h-none">
                      {post.tags.map(tag => (
                        <span key={tag} className="bg-ocean/10 text-ocean text-[11px] md:text-[12px] font-medium px-2 py-0.5 md:px-[10px] md:py-[2px] rounded-[20px]">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </DarkCard>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
