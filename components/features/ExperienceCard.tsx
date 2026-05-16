"use client";

import Image from "next/image";
import { Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";

export function ExperienceCard() {
  const experiences = [
    {
      id: 1,
      title: "Thuya Wood Workshop",
      duration: "2 hours",
      price: "250 MAD",
      image: "https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Sunset Surf Lesson",
      duration: "3 hours",
      price: "400 MAD",
      image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Gnaoua Night Tour",
      duration: "4 hours",
      price: "350 MAD",
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar py-6 snap-x snap-mandatory">
      {experiences.map((exp, i) => (
        <motion.div
          key={exp.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          className="relative shrink-0 w-[280px] sm:w-[340px] h-[200px] rounded-[20px] overflow-hidden group snap-center cursor-pointer shadow-lg"
        >
          <Image
            src={exp.image}
            alt={exp.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 280px, 340px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-ocean/90 via-brand-deep-ocean/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col gap-2">
            <h4 className="font-display font-bold text-white text-xl leading-tight">
              {exp.title}
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-brand-off-white/80 text-sm">
                <Clock className="w-4 h-4" />
                <span>{exp.duration}</span>
              </div>
              <div className="bg-brand-saffron text-brand-deep-ocean px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {exp.price}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
