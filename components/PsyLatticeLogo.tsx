import Image from "next/image";
import Link from "next/link";

type PsyLatticeLogoProps = {
  href?: string;
  size?: number;
};

export default function PsyLatticeLogo({
  href = "/",
  size = 42,
}: PsyLatticeLogoProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3"
      aria-label="PsyLattice home"
    >
      <Image
        src="/psylattice-mark.svg"
        alt=""
        width={size}
        height={size}
        priority
        className="object-contain"
      />

      <span className="text-xl font-semibold tracking-tight">
        <span className="text-slate-900">Psy</span>
        <span className="text-cyan-600">L</span>
        <span className="text-slate-900">attice</span>
      </span>
    </Link>
  );
}