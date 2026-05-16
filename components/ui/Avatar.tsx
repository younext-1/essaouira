import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

export function Avatar({ src, alt, size = "md", showStatus, className }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  return (
    <div className={cn("relative rounded-full shrink-0", sizes[size], className)}>
      <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-brand-off-white bg-brand-soft-gray">
        <Image src={src} alt={alt} fill className="object-cover" sizes="80px" />
      </div>
      {showStatus && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-brand-turquoise ring-2 ring-brand-off-white" />
      )}
    </div>
  );
}
