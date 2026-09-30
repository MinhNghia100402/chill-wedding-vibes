import { ArrowLeft, HeartCrack } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-styles";
import { Heading } from "@/components/ui/Heading";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center text-on-canvas">
      <HeartCrack className="h-14 w-14 text-accent" aria-hidden />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-accent">404</p>
      <Heading as="h1" className="mt-3">
        We couldn&apos;t find that wedding
      </Heading>
      <p className="mt-4 max-w-md text-on-canvas/70">
        The link may be misspelled, or the couple may have moved their site. Double-check the address on your
        invitation.
      </p>
      <Link href="/" className={buttonClasses("solid", "mt-8")}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> Browse wedding sites
      </Link>
    </main>
  );
}
