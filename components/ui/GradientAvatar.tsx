import React from "react";
import Image from "next/image";

export function GradientAvatar({ src, alt, size = 60, className = "" }: { src: string; alt: string; size?: number; className?: string }) {
  return (
    <div 
      className={`relative rounded-full p-[2px] bg-gradient-to-br from-ocean to-terracotta shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full overflow-hidden border-[2px] border-white relative">
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    </div>
  );
}
