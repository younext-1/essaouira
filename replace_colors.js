const fs = require('fs');
const path = require('path');

const files = [
  'components/GlobalChatbot.tsx',
  'components/SearchOverlay.tsx',
  'components/layout/BottomNav.tsx',
  'components/layout/NarrowSidebar.tsx',
  'components/layout/TopBar.tsx',
  'components/features/ExperienceCard.tsx',
  'components/features/FilterPills.tsx',
  'components/features/PostCard.tsx',
  'components/features/StoryReel.tsx'
];

const replacements = {
  // Modal Backdrops
  'bg-[#2D2A26]/40 backdrop-blur-sm': 'bg-[#18181B]/40 backdrop-blur-md',
  'bg-[#0F172A]/60 backdrop-blur-sm': 'bg-[#18181B]/40 backdrop-blur-md',
  'bg-black/60': 'bg-[#18181B]/60 backdrop-blur-md',
  
  // Containers
  'bg-white border-[#EBEBE3]': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'border-[#EBEAE4] bg-white': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'border border-gray-100 bg-white': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'bg-white border-warm-border': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'bg-[#FAFAF8]': 'bg-[#F5F0E8]',
  'bg-warm-sand': 'bg-[#F5F0E8]',
  
  // Colors - Text
  '#2D2A26': '#18181B',
  '#0F172A': '#18181B',
  '#111827': '#18181B',
  'text-brand-dark-text': 'text-[#18181B]',
  'text-text-primary': 'text-[#18181B]',
  
  // Colors - Muted
  '#6B6661': '#71717A',
  '#A5A29A': '#71717A',
  '#7C7771': '#71717A',
  '#64748B': '#71717A',
  'text-gray-500': 'text-[#71717A]',
  'text-gray-400': 'text-[#71717A]',
  'text-gray-600': 'text-[#71717A]',
  'text-text-secondary': 'text-[#71717A]',
  
  // Colors - Accents
  '#D46B4E': '#CA8A04',
  '#F59E0B': '#CA8A04',
  '#D97706': '#CA8A04',
  '#6366F1': '#18181B',
  'text-terracotta': 'text-[#CA8A04]',
  'bg-terracotta': 'bg-[#CA8A04]',
  'text-brand-terracotta': 'text-[#CA8A04]',
  'bg-brand-terracotta': 'bg-[#CA8A04]',
  
  // Colors - Backgrounds/Borders
  '#F5F3ED': '#F5F0E8',
  'bg-gray-50': 'bg-[#F5F0E8]',
  'bg-gray-100': 'bg-[#E8E3D8]',
  'border-gray-200': 'border-[rgba(232,227,216,0.8)]',
  'border-gray-100': 'border-[rgba(232,227,216,0.45)]',
  'border-[#EBEAE4]': 'border-[rgba(232,227,216,0.8)]',
  'border-[#EBEBE3]': 'border-[rgba(232,227,216,0.8)]',
  'border-warm-border': 'border-[rgba(232,227,216,0.8)]',
  
  // Specific Gradients
  'bg-gradient-to-tr from-[#D46B4E] to-[#EAA17C]': 'bg-accent-gradient hover-lift spring-transition',
  'bg-gradient-to-r from-ocean to-terracotta': 'bg-accent-gradient hover-lift spring-transition',
  
  // Typography Inline Styles
  "style={{ fontFamily: 'Outfit, sans-serif' }}": "",
  "style={{ fontFamily: 'Syne, sans-serif' }}": "",
  "font-serif": "font-display",
  
  // Spring transition
  "transition-all duration-300": "spring-transition",
  "transition-all": "spring-transition"
};

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
