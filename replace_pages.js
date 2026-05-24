const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f === 'page.tsx' || f === 'layout.tsx' || f === 'loading.tsx' || f === 'error.tsx') {
      callback(path.join(dir, f));
    }
  });
}

const replacements = {
  // Colors - Text
  '#2D2A26': '#18181B',
  '#0F172A': '#18181B',
  '#111827': '#18181B',
  '#1A1A2E': '#18181B',
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
  '#1B6CA8': '#CA8A04',
  '#2A9D8F': '#CA8A04',
  '#E8A020': '#CA8A04',
  '#C1440E': '#CA8A04',
  'text-terracotta': 'text-[#CA8A04]',
  'bg-terracotta': 'bg-[#CA8A04]',
  'text-brand-terracotta': 'text-[#CA8A04]',
  'bg-brand-terracotta': 'bg-[#CA8A04]',
  
  // Colors - Backgrounds/Borders
  '#FAFAF8': '#F5F0E8',
  '#F5F3ED': '#F5F0E8',
  'bg-gray-50': 'bg-[#F5F0E8]',
  'bg-gray-100': 'bg-[#E8E3D8]',
  'border-gray-200': 'border-[rgba(232,227,216,0.8)]',
  'border-gray-100': 'border-[rgba(232,227,216,0.45)]',
  'border-[#EBEAE4]': 'border-[rgba(232,227,216,0.8)]',
  'border-[#EBEBE3]': 'border-[rgba(232,227,216,0.8)]',
  'border-warm-border': 'border-[rgba(232,227,216,0.8)]',
  
  // Containers
  'bg-white border-[#EBEBE3]': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'border-[#EBEAE4] bg-white': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'border border-gray-100 bg-white': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  'bg-white border-warm-border': 'glass-premium-white border-[rgba(232,227,216,0.45)]',
  
  // Specific Gradients
  'bg-gradient-to-tr from-[#D46B4E] to-[#EAA17C]': 'bg-accent-gradient hover-lift spring-transition',
  'bg-gradient-to-r from-ocean to-terracotta': 'bg-accent-gradient hover-lift spring-transition',
  'bg-gradient-to-b from-[#1A1A2E] to-[#111827]': 'bg-[#18181B]',
  
  // Modal Backdrops
  'bg-[#2D2A26]/40 backdrop-blur-sm': 'bg-[#18181B]/40 backdrop-blur-md',
  'bg-[#0F172A]/60 backdrop-blur-sm': 'bg-[#18181B]/40 backdrop-blur-md',
  'bg-black/60': 'bg-[#18181B]/60 backdrop-blur-md',
  
  // Typography Inline Styles
  "style={{ fontFamily: 'Outfit, sans-serif' }}": "",
  "style={{ fontFamily: 'Syne, sans-serif' }}": "",
  "style={{ fontFamily: 'var(--font-sans), sans-serif' }}": "",
  "style={{ fontFamily: 'var(--font-display), serif' }}": "",
  "font-serif": "font-display",
  
  // Spring transition
  "transition-all duration-300": "spring-transition",
  "transition-all duration-500": "spring-transition",
  "transition-all duration-700": "spring-transition",
  "transition-all": "spring-transition",
};

walkDir(path.join(process.cwd(), 'app'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
