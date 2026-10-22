import React from "react";
import { Users, Compass, ShieldCheck, HeartHandshake } from "lucide-react";

const VALUES = [
  {
    icon: Users,
    title: "Intimate Small Groups",
    desc: "Capped at 8 to 12 travelers. Avoid tour buses and forge genuine friendships while accessing hidden wilderness locations.",
  },
  {
    icon: Compass,
    title: "Veteran Local Guides",
    desc: "Led by certified mountaineers, historians, and wildlife biologists with deep ancestral ties to their landscapes.",
  },
  {
    icon: ShieldCheck,
    title: "Fair Pricing & Easy Terms",
    desc: "Clear inclusive prices without hidden resort fees. Enjoy free cancellation up to 14–30 days on most departures.",
  },
  {
    icon: HeartHandshake,
    title: "Conscious & Sustainable",
    desc: "We prioritize locally-owned boutique eco-lodges, farm-to-table dining, and zero-single-use-plastic trails.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-[#f4efe6] border-y border-[#e8e3d8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
            The Touroholic Difference
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
            Why Discerning Travelers Choose Us
          </h2>
          <p className="text-sm text-stone-600 mt-3 leading-relaxed">
            We reject rushed tourist check-lists in favor of deep immersion, authentic human connection, and responsible exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUES.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white p-7 rounded-2xl border border-[#e2dcce] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#124e3f]/10 text-[#124e3f] flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c2421]">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
