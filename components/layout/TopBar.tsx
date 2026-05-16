import { Search, Bell } from "lucide-react";

const LogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12c3-3 6-3 9 0s6 3 9 0" />
    <path d="M2 17c3-3 6-3 9 0s6 3 9 0" />
    <path d="M21 6.5a5 5 0 0 1-7.5-3.5 5 5 0 0 0 7.5 3.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export function TopBar() {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-brand-off-white/90 backdrop-blur-md border-b border-brand-soft-gray px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-brand-deep-ocean">
        <LogoIcon className="w-6 h-6" />
        <span className="font-display font-bold text-lg tracking-wide">Mogador Connect</span>
      </div>
      <div className="flex items-center gap-3 text-brand-dark-text">
        <button className="p-2 hover:bg-brand-soft-gray rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-brand-soft-gray rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-rose rounded-full border border-white" />
        </button>
      </div>
    </div>
  );
}
