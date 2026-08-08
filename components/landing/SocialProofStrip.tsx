const STATS = [
  { num: "10M+", label: "Indian weddings every year", accent: false },
  { num: "₹4L Cr", label: "Annual wedding industry spend", accent: false },
  { num: "Zero", label: "End-to-end platforms before Evenzi", accent: true },
];

export default function SocialProofStrip() {
  return (
    <section className="w-full bg-[rgba(187,0,32,0.03)] border-t border-b border-[rgba(187,0,32,0.08)] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="relative flex flex-col items-center text-center px-10 md:px-16 py-6 md:py-0"
            >
              {i > 0 && (
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[rgba(8,8,8,0.10)]" />
              )}
              <div
                className={`font-serif font-light leading-none ${
                  stat.accent ? "italic text-[#c8a96e]" : "text-[#080808]"
                }`}
                style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
              >
                {stat.num}
              </div>
              <div
                className="font-sans text-[rgba(8,8,8,0.4)] uppercase tracking-[2px] mt-3 leading-[1.7]"
                style={{ fontSize: "10px" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
