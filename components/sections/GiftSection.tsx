"use client";

import { Check, Copy, ExternalLink, Gift, Landmark } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { BankAccount, Registry } from "@/lib/types";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); the value stays visible to copy manually.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      className="rounded-lg p-1.5 text-accent transition hover:bg-primary/10"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function AccountCard({ account }: { account: BankAccount }) {
  return (
    <article className="flex flex-col items-center rounded-3xl bg-surface p-6 text-center text-on-surface shadow-lg shadow-on-canvas/5 ring-1 ring-primary/10 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{account.label}</p>

      {/* QR stays dark-on-white regardless of theme so every scanner can read it. */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-inner ring-4 ring-primary/20">
        <QRCodeSVG
          value={account.qrPayload}
          size={176}
          level="M"
          bgColor="#ffffff"
          fgColor="#111111"
          title={`Payment QR code for ${account.accountName}`}
        />
      </div>

      <dl className="mt-6 w-full space-y-2 text-sm">
        <div className="flex items-center justify-center gap-2">
          <Landmark className="h-4 w-4 text-accent" aria-hidden />
          <dt className="sr-only">Bank</dt>
          <dd className="font-semibold">{account.bankName}</dd>
        </div>
        <div>
          <dt className="sr-only">Account name</dt>
          <dd className="uppercase tracking-wide opacity-80">{account.accountName}</dd>
        </div>
        <div className="flex items-center justify-center gap-1">
          <dt className="sr-only">Account number</dt>
          <dd className="font-mono text-base tracking-wider">{account.accountNumber}</dd>
          <CopyButton value={account.accountNumber.replace(/\s/g, "")} label="account number" />
        </div>
      </dl>
    </article>
  );
}

export function GiftSection({ registry }: { registry: Registry }) {
  return (
    <Section id="gifts" eyebrow="With love" title="Wedding Gifts" intro={registry.message} tone="alt">
      {registry.accounts.length > 0 && (
        <div
          className={`mx-auto grid max-w-3xl gap-6 ${registry.accounts.length > 1 ? "sm:grid-cols-2" : "max-w-sm"}`}
        >
          {registry.accounts.map((account, i) => (
            <Reveal key={account.accountNumber} delay={i * 0.1}>
              <AccountCard account={account} />
            </Reveal>
          ))}
        </div>
      )}

      {registry.links.length > 0 && (
        <Reveal className="mt-12 text-center">
          <Heading as="h3" size="md" className="inline-flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" aria-hidden /> Registries
          </Heading>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {registry.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline")}>
                {link.store} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ))}
          </div>
        </Reveal>
      )}
    </Section>
  );
}
