import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  href?: string;
};

const sizeMap = {
  sm: { width: 100, height: 32 },
  md: { width: 136, height: 42 },
  lg: { width: 176, height: 54 }
} as const;

export function Logo({ size = "md", showWordmark = false, href }: LogoProps) {
  const dimensions = sizeMap[size];
  const content = (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/logo.svg"
        alt="PLAground logo"
        width={dimensions.width}
        height={dimensions.height}
        className="h-auto w-auto"
        priority
      />
      {showWordmark ? (
        <span className="hidden font-[var(--font-heading)] text-sm font-semibold tracking-wide text-brand-text sm:inline">
          PLAYGROUND.AU
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
