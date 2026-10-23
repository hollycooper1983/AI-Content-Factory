// Scholarship Scam Checker: a limited heuristic review of a URL and optional description.
// It never fetches the URL (avoids server-side request forgery) and never guarantees legitimacy.

export interface ScamFinding {
  level: "warning" | "caution" | "info";
  message: string;
}

const RED_FLAG_PHRASES: [RegExp, string][] = [
  [/(application|processing|registration|redemption|disbursement)\s+fee/i, "Asks for a fee to apply or receive money. Legitimate scholarships don't charge to apply."],
  [/guarantee(d)?/i, "Promises a guaranteed award. No one can guarantee you a scholarship."],
  [/(bank|checking)\s+account|routing number|credit card/i, "Asks for bank or card details. Never provide these to apply for a scholarship."],
  [/social security|\bssn\b/i, "Asks for a Social Security number. Be very cautious; most scholarship applications don't need it up front."],
  [/you('ve| have)? (been )?(selected|won)|congratulations.*(winner|finalist)/i, "Says you won something you didn't apply for. This is a common scam pattern."],
  [/act now|limited time|expires (today|tonight)|only \d+ spots/i, "Uses high-pressure urgency."],
  [/do(es)? the work for you|we apply for you|money.?back/i, "Offers to apply for you for a price or offers a money-back guarantee."],
  [/gift card|wire transfer|crypto|bitcoin|zelle|cash ?app/i, "Mentions gift cards, wire transfers or crypto payments."],
];

const RISKY_TLDS = [".xyz", ".top", ".click", ".loan", ".win", ".buzz", ".icu", ".rest"];
const TRUSTED_SUFFIXES = [".gov", ".edu"];

export function checkScholarship(rawUrl: string, description = ""): { findings: ScamFinding[]; summary: string; parsedHost: string | null } {
  const findings: ScamFinding[] = [];
  let host: string | null = null;
  const url = rawUrl.trim();
  if (url) {
    try {
      const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      host = u.hostname.toLowerCase();
      if (/^http:\/\//i.test(url)) findings.push({ level: "caution", message: "The link doesn't use HTTPS, so information you send isn't encrypted." });
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) findings.push({ level: "warning", message: "The link points to a raw IP address instead of an organization's domain." });
      if (RISKY_TLDS.some((t) => host!.endsWith(t))) findings.push({ level: "caution", message: `The domain ending is frequently used by low-cost or disposable sites. Verify the sponsor independently.` });
      if (host.split("-").length > 3 || host.length > 40) findings.push({ level: "caution", message: "The domain name is unusually long or hyphenated." });
      if (/(free|easy|cash|money|win).*(scholar|grant)|(scholar|grant).*(free|cash|money|win)/.test(host)) findings.push({ level: "caution", message: "The domain name uses promotional words like 'free money'." });
      if (TRUSTED_SUFFIXES.some((t) => host!.endsWith(t))) findings.push({ level: "info", message: "The domain is a .gov or .edu address, which are restricted registrations. Still confirm the page belongs to the sponsor." });
      if (u.username || u.password) findings.push({ level: "warning", message: "The link contains embedded login details, a common phishing trick." });
    } catch {
      findings.push({ level: "warning", message: "That doesn't look like a valid web address." });
    }
  }
  for (const [re, msg] of RED_FLAG_PHRASES) if (re.test(description)) findings.push({ level: "warning", message: msg });

  const warnings = findings.filter((f) => f.level === "warning").length;
  const cautions = findings.filter((f) => f.level === "caution").length;
  const summary =
    warnings > 0
      ? "We found serious warning signs. Do not send money or personal financial information. Verify with your school counselor or financial aid office."
      : cautions > 0
        ? "We found some things worth double-checking. Confirm the sponsor through an independent source before applying."
        : "We didn't find common warning signs, but this check is limited and can't confirm a scholarship is legitimate. Always verify with the sponsor directly.";
  return { findings, summary, parsedHost: host };
}
