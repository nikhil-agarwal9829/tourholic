import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Compass, Shield, Mountain, Sun, Landmark } from "lucide-react";

const POPULAR_DESTINATIONS = [
  {
    name: "Banff & Canadian Rockies",
    country: "Canada",
    toursCount: "3 Expeditions",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    href: "/tours?destination=Banff",
  },
  {
    name: "Amalfi Coast & Capri",
    country: "Italy",
    toursCount: "2 Expeditions",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    href: "/tours?destination=Amalfi",
  },
  {
    name: "Kyoto & Ancient Honshu",
    country: "Japan",
    toursCount: "2 Expeditions",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    href: "/tours?destination=Kyoto",
  },
  {
    name: "Serengeti & Mara Plains",
    country: "Tanzania",
    toursCount: "2 Expeditions",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    href: "/tours?destination=Serengeti",
  },
];

const CATEGORIES = [
  {
    id: "adventure",
    name: "Alpine Trekking",
    icon: Mountain,
    desc: "Glacial passes, jagged peaks, and mountain huts.",
    href: "/tours?category=adventure",
  },
  {
    id: "cultural",
    name: "Cultural Immersion",
    icon: Landmark,
    desc: "Ancient shrines, artisanal tastings, and living history.",
    href: "/tours?category=cultural",
  },
  {
    id: "wildlife",
    name: "Wildlife Safari",
    icon: Compass,
    desc: "Savannah migrations, rare species, and open-top trackers.",
    href: "/tours?category=wildlife",
  },
  {
    id: "nature",
    name: "Nature & Retreat",
    icon: Sun,
    desc: "Lakeside calm, thermal lagoons, and coastal walks.",
    href: "/tours?category=nature",
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 bg-[#fbfaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Categories Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Travel Styles
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
                Curated by Passion
              </h2>
            </div>
            <Link
              href="/tours"
              className="text-xs font-semibold uppercase tracking-wider text-[#124e3f] hover:text-[#0c382d] flex items-center gap-1 mt-4 md:mt-0"
            >
              <span>Explore All Categories</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="group bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow hover:travel-card-shadow-hover hover:border-[#124e3f]/40 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f4efe6] group-hover:bg-[#124e3f] text-[#124e3f] group-hover:text-white flex items-center justify-center transition-colors mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1c2421] group-hover:text-[#124e3f] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Destinations Grid */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Iconic Horizons
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
                Featured Destinations
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_DESTINATIONS.map((dest, i) => (
              <Link
                key={i}
                href={dest.href}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md block"
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
                    {dest.country}
                  </span>
                  <h3 className="font-serif text-xl font-bold leading-tight mt-1 group-hover:text-amber-100 transition-colors">
                    {dest.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-xs text-stone-200">
                    <span>{dest.toursCount}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
