"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Bookmark, Share2, MapPin, ArrowRight, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { GradientAvatar } from "@/components/ui/GradientAvatar";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";

interface PostDetail {
  id: string;
  author_id: string;
  title: string | null;
  content: string | null;
  category: string | null;
  location: string | null;
  view_count: number;
  created_at: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  author_location: string | null;
  author_whatsapp: string | null;
  likes_count: number;
  tags: string[] | null;
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const user = isSignedIn ? profile : null;

  useEffect(() => {
    const fetchPost = async () => {
      const supabase = createClient();

      const { data } = await supabase.from("posts_with_counts").select("*").eq("id", id).single();
      if (!data) { setLoading(false); return; }
      setPost(data as PostDetail);
      setLikeCount(data.likes_count || 0);

      const { data: imgs } = await supabase.from("post_images").select("url").eq("post_id", id).order("sort_order");
      const imgUrls = imgs?.map((i: { url: string }) => i.url) ?? [];
      setImages(imgUrls.length > 0 ? imgUrls : data.cover_image ? [data.cover_image] : []);

      // Increment views
      await supabase.rpc("increment_view_count", { p_post_id: id });

      // Check user interactions
      if (user) {
        const [likeRes, bookmarkRes] = await Promise.all([
          supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
          supabase.from("bookmarks").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
        ]);
        setLiked(!!likeRes.data);
        setSaved(!!bookmarkRes.data);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id, user]);

  const toggleLike = async () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    if (!user) return;
    const supabase = createClient();
    if (liked) await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
    else await supabase.from("likes").insert({ post_id: id, user_id: user.id });
  };

  const toggleSave = async () => {
    setSaved(!saved);
    if (!user) return;
    const supabase = createClient();
    if (saved) await supabase.from("bookmarks").delete().eq("post_id", id).eq("user_id", user.id);
    else await supabase.from("bookmarks").insert({ post_id: id, user_id: user.id });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center" dir="rtl">
        <div>
          <div className="text-[48px] mb-4">😕</div>
          <h2 className="text-text-primary text-[20px] font-bold mb-2">المنشور غير موجود</h2>
          <Link href="/explore" className="text-ocean text-[14px] font-medium hover:underline">العودة للاستكشاف</Link>
        </div>
      </div>
    );
  }

  const timeAgo = (() => {
    const mins = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 60000);
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    return `منذ ${Math.floor(hrs / 24)} يوم`;
  })();

  return (
    <div className="flex-1 w-full max-w-[800px] mx-auto pb-24" dir="rtl">

      {/* Image gallery */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-warm-sand">
        {images.length > 0 ? (
          <>
            <Image src={images[currentImg]} alt={post.title || ""} fill className="object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setCurrentImg((c) => (c > 0 ? c - 1 : images.length - 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center z-10"><ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => setCurrentImg((c) => (c < images.length - 1 ? c + 1 : 0))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center z-10"><ChevronLeft className="w-5 h-5" /></button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentImg ? "bg-white" : "bg-white/40"}`} />))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-16 h-16 text-text-muted" /></div>
        )}
        <Link href="/explore" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center z-10">
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="px-4 md:px-6">

        {/* Actions */}
        <div className="flex items-center justify-between py-3 border-b border-warm-border">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: [1, 1.4, 1] }} onClick={toggleLike} className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] justify-center">
              <Heart className={`w-6 h-6 ${liked ? "fill-saffron text-saffron" : "text-text-muted"}`} />
              <span className={`text-[15px] font-medium ${liked ? "text-saffron" : "text-text-muted"}`}>{likeCount}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 1.2 }} className="text-text-muted min-w-[44px] min-h-[44px] flex items-center justify-center"><Share2 className="w-6 h-6" /></motion.button>
          </div>
          <motion.button whileTap={{ scale: 1.2 }} onClick={toggleSave}>
            <Bookmark className={`w-6 h-6 ${saved ? "fill-terracotta text-terracotta" : "text-text-muted"}`} />
          </motion.button>
        </div>

        {/* Category + time */}
        <div className="flex items-center gap-3 mt-4 mb-3">
          <span className="bg-terracotta/10 text-terracotta text-[12px] font-medium px-3 py-1 rounded-full">{post.category}</span>
          <span className="text-text-muted text-[12px]">{timeAgo}</span>
          <span className="text-text-muted text-[12px]">👁 {post.view_count}</span>
        </div>

        {/* Title */}
        <h1 className="text-text-primary text-[24px] md:text-[28px] font-bold font-display leading-tight mb-4">{post.title}</h1>

        {/* Content */}
        <p className="text-text-secondary text-[15px] md:text-[16px] leading-[1.8] mb-6 whitespace-pre-wrap">{post.content}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-ocean/10 text-ocean text-[12px] font-medium px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-2 text-text-muted text-[14px] mb-8">
            <MapPin className="w-4 h-4 text-terracotta" /> {post.location}
          </div>
        )}

        {/* Author card */}
        <Link href={`/profile/${post.username}`}>
          <div className="bg-white rounded-[20px] border border-warm-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-pointer">
            <GradientAvatar src={post.avatar_url || ""} alt={post.full_name || ""} size={56} className="group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-bold text-[16px] flex items-center gap-1.5">
                {post.full_name}
                {post.verified && <span className="text-ocean text-[14px]">✓</span>}
              </h3>
              <p className="text-text-muted text-[13px]">{post.author_location}</p>
            </div>
            <span className="text-ocean text-[13px] font-medium shrink-0">عرض الملف ←</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
