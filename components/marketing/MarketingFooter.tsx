import Link from "next/link";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { marketingFeatures } from "@/lib/marketing-features";

const ANDROID_APP_FILE_ID = "1hzWlv_JGRLd047m0dd2pqoSmjKlQ9Mha";
const ANDROID_APP_URL = `https://drive.google.com/uc?export=download&id=${ANDROID_APP_FILE_ID}`;

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1380px] px-6 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_.75fr_.75fr_.75fr]">
          <div>
            <PsyLatticeLogo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              World-class research made accessible. Design, collect, analyse and write in one connected psychological research environment.
            </p>
            <a
              href={ANDROID_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-semibold text-cyan-800"
            >
              Android companion
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">Research features</p>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              {marketingFeatures.slice(0, 5).map((feature) => (
                <Link key={feature.slug} href={`/features/${feature.slug}`} className="block hover:text-slate-950">
                  {feature.shortTitle}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">Platform</p>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <Link href="/signin" className="block hover:text-slate-950">Researcher</Link>
              <Link href="/signin" className="block hover:text-slate-950">Self</Link>
              <Link href="/signin" className="block hover:text-slate-950">Clinical</Link>
              <Link href="/security" className="block hover:text-slate-950">Security</Link>
              <Link href="/contact" className="block hover:text-slate-950">Contact</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">Legal</p>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <Link href="/privacy" className="block hover:text-slate-950">Privacy</Link>
              <Link href="/terms" className="block hover:text-slate-950">Terms</Link>
              <Link href="/data-policy" className="block hover:text-slate-950">Data policy</Link>
              <Link href="/about" className="block hover:text-slate-950">About</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© 2026 PsyLattice.</p>
          <p>Designed for responsible psychological research and measurement.</p>
        </div>
      </div>
    </footer>
  );
}
