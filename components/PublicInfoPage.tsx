import Link from "next/link";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Section = {
  title: string;
  content: React.ReactNode;
};

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Section[];
  notice?: string;
};

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
  notice,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7faf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 lg:px-8">
          <PsyLatticeLogo />

          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            Back to website
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
            {eyebrow}
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            {description}
          </p>

          {notice && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              {notice}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="space-y-14">
          {sections.map((section) => (
            <section
              key={section.title}
              className="border-b border-slate-200 pb-12 last:border-none"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                {section.title}
              </h2>

              <div className="mt-5 space-y-4 text-[16px] leading-8 text-slate-600">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 py-10 text-sm text-slate-500 sm:flex-row lg:px-8">
          <p>© 2026 PsyLattice.</p>

          <div className="flex flex-wrap gap-6">
            <Link href="/about" className="hover:text-slate-950">
              About
            </Link>

            <Link href="/security" className="hover:text-slate-950">
              Security
            </Link>

            <Link href="/privacy" className="hover:text-slate-950">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-slate-950">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}