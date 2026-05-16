import Image from "next/image";
import { Store, Tag } from "lucide-react";

export default function Marketplace() {
  const products = [
    {
      id: 1,
      title: "Hand-carved Thuya Box",
      price: "350 MAD",
      seller: "Amine's Craft Shop",
      image: "https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Argan Oil (Pure, 100ml)",
      price: "120 MAD",
      seller: "Cooperative Tighanimine",
      image: "https://images.unsplash.com/photo-1626248695509-f831923e4297?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Beginner Kite Board",
      price: "1200 MAD",
      seller: "Mogador Surf School",
      image: "https://images.unsplash.com/photo-1544108866-932b1ff979ee?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "Traditional Gnaoua Guembri",
      price: "850 MAD",
      seller: "Medina Music Shop",
      image: "https://images.unsplash.com/photo-1595069906974-f98b9e691d6f?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display-xl font-bold text-[#1a1a2e] mb-2 flex items-center gap-3">
          <Store className="w-8 h-8 text-blue-500" />
          Marketplace
        </h2>
        <p className="text-[#1a1a2e]/70">Support local artisans and businesses directly from Mogador.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col group">
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              <Image 
                src={product.image} 
                alt={product.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-[#1a1a2e] mb-1 line-clamp-1">{product.title}</h3>
              <p className="text-sm text-[#1a1a2e]/60 mb-4">{product.seller}</p>
              
              <div className="mt-auto flex items-center justify-between">
                <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {product.price}
                </span>
                <button className="px-4 py-1.5 bg-[#1a1a2e] text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors">
                  Buy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
