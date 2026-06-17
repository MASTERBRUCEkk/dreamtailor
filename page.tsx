function PricingCard({
  name,
  price,
  badge,
  features,
}: {
  name: string;
  price: string;
  badge?: string;
  features: string[];
}) {
  return (
    <div className="border border-slate-800 rounded-2xl p-6">
      <h3 className="font-serif text-xl mb-1">{name}</h3>
      <p className="text-amber-400 text-2xl mb-1">{price}</p>
      {badge && (
        <p className="text-emerald-400 text-xs uppercase tracking-wide mb-3">{badge}</p>
      )}
      <ul className="text-slate-400 text-sm space-y-2">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-amber-400 text-sm uppercase tracking-widest mb-4">
          A new story, every night
        </p>
        <h1 className="text-4xl md:text-5xl font-serif mb-6">
          Bedtime, written just for them.
        </h1>
        <p className="text-slate-300 text-lg mb-10">
          Tell us your child&apos;s name, age, and a favorite thing. DreamTailor writes a
          brand new story and emails it to you, ready before lights out.
        </p>
        <a
          href="/signup"
          className="inline-block bg-amber-400 text-slate-950 font-semibold px-8 py-4 rounded-full"
        >
          Get tonight&apos;s first story free
        </a>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8 text-center">
        <div>
          <h3 className="font-serif text-xl mb-2">Personalized</h3>
          <p className="text-slate-400 text-sm">
            Every story is written around your child&apos;s name, age, and interests.
          </p>
        </div>
        <div>
          <h3 className="font-serif text-xl mb-2">Safe by design</h3>
          <p className="text-slate-400 text-sm">
            No violence, no scares, no ads — every story is screened before it reaches
            your inbox.
          </p>
        </div>
        <div>
          <h3 className="font-serif text-xl mb-2">Delivered nightly</h3>
          <p className="text-slate-400 text-sm">
            A fresh story lands in your inbox before bedtime, every night you&apos;re
            subscribed.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif text-center mb-10">Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            name="Starter"
            price="$6/mo"
            badge="3 days free"
            features={["One child", "3 stories a week"]}
          />
          <PricingCard
            name="Family"
            price="$12/mo"
            features={["Up to 3 children", "A story every night"]}
          />
          <PricingCard
            name="Premium"
            price="$19/mo"
            features={["Unlimited children", "Audio narration", "Grandparent sharing"]}
          />
        </div>
      </section>
    </main>
  );
}
