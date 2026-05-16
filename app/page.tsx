

import { PostCard } from "@/components/features/PostCard";
import { StoryReel } from "@/components/features/StoryReel";
import { ExperienceCard } from "@/components/features/ExperienceCard";
import { FilterPills } from "@/components/features/FilterPills";

export default function Home() {
  const posts = [
    {
      id: 1,
      author: "Amine's Craft Shop",
      isVerified: true,
      category: "Artisan",
      location: "Medina, Essaouira",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
      title: "Handcrafted Thuya Magic",
      description: "New collection of handcrafted Thuya wood boxes. Each piece is carved with love to reflect the warm soul of Mogador. Available now in the shop!",
      tags: ["#Artisan", "#Handmade", "#ThuyaWood"],
      image: "https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=800&auto=format&fit=crop",
      views: "12.4k"
    },
    {
      id: 2,
      author: "Mogador Surf School",
      isVerified: true,
      category: "Surf",
      location: "Essaouira Beach",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
      title: "Chasing the Golden Hour",
      description: "A perfect end to a great day with waves and sunset. Are you ready for the kite surf experience tomorrow? The winds are waiting for you!",
      tags: ["#Kitesurf", "#Surfing", "#SunsetVibes"],
      image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop",
      views: "8.9k"
    },
    {
      id: 3,
      author: "Gnaoua Festival",
      isVerified: true,
      category: "Music",
      location: "Place Moulay Hassan",
      avatar: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=150&auto=format&fit=crop",
      title: "The Rhythm of Mogador",
      description: "We are happy to announce the lineup for this year's festival! Get ready for a magical blend of Gnaoua music and international jazz. Tickets available now.",
      tags: ["#GnaouaFestival", "#Heritage", "#SpiritualMusic"],
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop",
      views: "45.2k"
    }
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Hero Banner */}
      <section className="relative w-full h-[250px] md:h-[350px] overflow-hidden bg-brand-deep-ocean">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-[2px] scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1600&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-off-white via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h2 className="font-arabic text-4xl md:text-6xl font-bold mb-2 tracking-wide drop-shadow-lg">مرحباً بك في موكادور</h2>
          <p className="font-display text-xl md:text-2xl italic tracking-wider drop-shadow-md">Welcome to Mogador</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex flex-col gap-8 -mt-6 relative z-10">
        <section className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <StoryReel />
        </section>

        <section>
          <FilterPills />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl font-bold text-brand-dark-text">Featured Experiences</h3>
            <button className="text-brand-saffron font-medium hover:text-brand-terracotta transition-colors">View All</button>
          </div>
          <ExperienceCard />
        </section>

        <section className="mt-4">
          <h3 className="font-display text-2xl font-bold text-brand-dark-text mb-6">Explore the Feed</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                index={index}
                author={post.author}
                avatar={post.avatar}
                isVerified={post.isVerified}
                category={post.category}
                location={post.location}
                title={post.title}
                description={post.description}
                tags={post.tags}
                image={post.image}
                views={post.views}
              />
            ))}
          </div>
        </section>

        {/* Footer Area */}
        <section className="flex flex-col items-center justify-center py-12 gap-6 border-t border-brand-dark-text/10 mt-8">
          <button className="relative group px-8 py-3 bg-brand-off-white text-brand-deep-ocean font-bold rounded-full overflow-hidden border-2 border-brand-deep-ocean transition-all">
            <div className="absolute inset-0 w-full h-full bg-brand-deep-ocean translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">Load More Waves</span>
          </button>
          <p className="text-brand-dark-text/50 font-medium">Proudly made in Essaouira 🌊</p>
        </section>
      </div>
    </div>
  );
}
