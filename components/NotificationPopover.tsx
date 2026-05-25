'use client';

import { Bell, Sparkles, Store, Compass, HeartHandshake, X } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: number;
  type: 'store' | 'promo' | 'system' | 'craft';
  title: string;
  body: string;
  timeText: string;
  link: string;
  unread: boolean;
}

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationPopover({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPopoverProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Click-out Backdrop overlay */}
      <div className="fixed inset-0 z-[80]" onClick={onClose} />

      {/* Popover Container */}
      <div 
        className="absolute top-14 left-4 z-[90] w-76 sm:w-80 bg-white border border-[rgba(232,227,216,0.45)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 select-none text-right font-sans"
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="bg-[#1C1917] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FFD43F]" />
            <h4 className="text-xs font-black">التنبيهات الحية</h4>
          </div>
          {notifications.some(n => n.unread) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMarkAllAsRead();
              }}
              className="text-[9px] font-black text-[#FFD43F] hover:underline cursor-pointer bg-transparent active-push"
            >
              قراءة الكل
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              // Icon mapping
              let Icon = Compass;
              let iconColor = 'text-blue-500 bg-blue-50';
              if (item.type === 'store') {
                Icon = Store;
                iconColor = 'text-indigo-500 bg-indigo-50';
              } else if (item.type === 'promo') {
                Icon = Sparkles;
                iconColor = 'text-amber-500 bg-amber-50';
              } else if (item.type === 'system') {
                Icon = HeartHandshake;
                iconColor = 'text-emerald-500 bg-emerald-50';
              }

              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    onMarkAsRead(item.id);
                    onClose();
                  }}
                  className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer hover:bg-gray-50/70 relative ${
                    item.unread ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Unread Indicator Dot */}
                  {item.unread && (
                    <span className="absolute top-4.5 right-2 h-2 w-2 rounded-full bg-[#E61E42]" />
                  )}

                  {/* Icon Box */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0 pr-1.5 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9.5px] font-black text-gray-500 uppercase tracking-wide">
                        {item.title}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400">
                        {item.timeText}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                      {item.body}
                    </p>

                    <div className="pt-1 flex justify-start">
                      <Link 
                        href={item.link}
                        className="text-[9px] font-black text-[#E61E42] hover:underline"
                      >
                        عرض التفاصيل ➔
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Empty Notifications State
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[11px] font-black">لا توجد تنبيهات جديدة حالياً</p>
              <p className="text-[9px] text-gray-400 font-light mt-0.5">سنعلمك فور توفر عروض أو تحديثات ممتازة!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
