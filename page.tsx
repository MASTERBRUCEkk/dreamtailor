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

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-slate-800 pb-5">
      <p className="font-medium mb-2">{q}</p>
      <p className="text-slate-400 text-sm">{a}</p>
    </div>
  );
}

function Testimonial({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="border border-slate-800 rounded-2xl p-6">
      <p className="font-serif italic mb-3">&ldquo;{quote}&rdquo;</p>
      <p className="text-slate-500 text-sm">{name}</p>
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

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif text-center mb-10">What families say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Testimonial
            quote="My son asked for a story about his hamster being brave. It was waiting in his inbox before I'd even finished making dinner."
            name="A parent of one"
          />
          <Testimonial
            quote="The closing lines actually work — she's usually asleep before the story finishes."
            name="A parent of two"
          />
          <Testimonial
            quote="We rotate voices depending on who's exhausted that night. It's become the calmest part of our evening."
            name="A parent of three"
          />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif text-center mb-10">Keeping it safe for kids</h2>
        <div className="space-y-4 text-slate-300 text-sm">
          <p>
            Every story is generated under a strict set of rules before it&apos;s ever shown
            to you: no violence, no scary or suspenseful content, no romantic content, no
            unsafe behavior a child could imitate, no stereotypes, and no real brand names
            or copyrighted characters.
          </p>
          <p>
            After it&apos;s written, every story is checked again with a separate content
            moderation pass. Anything flagged is held back from your inbox and reviewed by
            a person before any decision is made about it — it&apos;s never sent automatically
            just because it passed the first check.
          </p>
          <p>
            We log every generation attempt, flagged or not, so there&apos;s always an audit
            trail of what was written and why a particular story was or wasn&apos;t sent.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif text-center mb-10">Our privacy commitment</h2>
        <div className="space-y-4 text-slate-300 text-sm">
          <p>
            We collect what&apos;s needed to write your child&apos;s stories — a first name, age,
            and whatever details you choose to add — and nothing else. We don&apos;t sell or
            share this information with advertisers.
          </p>
          <p>
            Story content and the details behind it are only used to generate that child&apos;s
            stories. You can delete a child&apos;s profile, and the stories tied to it, at any
            time from the dashboard.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif text-center mb-10">Questions</h2>
        <div className="space-y-5">
          <FaqItem
            q="How personalized are the stories, really?"
            a="Each one is written fresh, using your child's name, age, favorite things, tonight's mood, and — if you've set one up — a recurring character or a real moment from their day."
          />
          <FaqItem
            q="What if I don't like a story?"
            a="You can generate a new one any time from the dashboard. Nothing is locked in."
          />
          <FaqItem
            q="Can grandparents get the stories too?"
            a="Yes — add their email addresses in a child's settings and they'll be copied on every story sent for that child."
          />
          <FaqItem
            q="What languages are supported?"
            a="You can set any language per child, and stories will be written in that language."
          />
          <FaqItem
            q="Can I cancel or pause anytime?"
            a="Yes, from the dashboard — pausing stops billing and story delivery without deleting your child's profile or story history."
          />
        </div>
      </section>
    </main>
  );
}
