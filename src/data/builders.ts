import { z } from "zod";
import type { BuilderContext, QRType, TypeBuilder } from "../types.js";
import { assertProtocolAllowed, sanitizeUrl } from "../security/validation.js";

const urlBuilder: TypeBuilder<{ url: string }> = {
  validateAndBuild(input) {
    const url = sanitizeUrl(z.object({ url: z.string().url() }).parse(input).url);
    assertProtocolAllowed(url);
    return url;
  }
};

const appBuilder: TypeBuilder<{ ios?: string; android?: string; fallback?: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      ios: z.string().url().optional(),
      android: z.string().url().optional(),
      fallback: z.string().url().optional()
    }).refine((x) => x.ios || x.android || x.fallback, "At least one app URL is required.").parse(input);
    return `APP::${JSON.stringify(parsed)}`;
  }
};

const textBuilder: TypeBuilder<{ text: string }> = {
  validateAndBuild(input) {
    return z.object({ text: z.string().min(1).max(4000) }).parse(input).text;
  }
};

const mapBuilder: TypeBuilder<{ lat: number; lng: number; label?: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      label: z.string().max(120).optional()
    }).parse(input);
    const maps = new URL("https://maps.google.com/");
    maps.searchParams.set("q", `${parsed.lat},${parsed.lng}`);
    if (parsed.label) maps.searchParams.set("label", parsed.label);
    return maps.toString();
  }
};

const wifiBuilder: TypeBuilder<{ ssid: string; password?: string; encryption?: "WPA" | "WEP" | "nopass"; hidden?: boolean }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      ssid: z.string().min(1),
      password: z.string().optional(),
      encryption: z.enum(["WPA", "WEP", "nopass"]).default("WPA"),
      hidden: z.boolean().default(false)
    }).parse(input);
    const esc = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");
    return `WIFI:T:${parsed.encryption};S:${esc(parsed.ssid)};P:${esc(parsed.password ?? "")};H:${parsed.hidden ? "true" : "false"};;`;
  }
};

const mediaBuilder: TypeBuilder<{ url: string; kind: "audio" | "video" | "file" }> = {
  validateAndBuild(input) {
    const parsed = z.object({ url: z.string().url(), kind: z.enum(["audio", "video", "file"]) }).parse(input);
    const url = sanitizeUrl(parsed.url);
    assertProtocolAllowed(url);
    return `${parsed.kind.toUpperCase()}::${url}`;
  }
};

const documentBuilder: TypeBuilder<{ url: string; kind: "pdf" | "pptx" | "excel" | "doc" }> = {
  validateAndBuild(input) {
    const parsed = z.object({ url: z.string().url(), kind: z.enum(["pdf", "pptx", "excel", "doc"]) }).parse(input);
    return `${parsed.kind.toUpperCase()}::${sanitizeUrl(parsed.url)}`;
  }
};

const messageBuilder: TypeBuilder<
  | { kind: "whatsapp"; phone: string; text?: string }
  | { kind: "telegram"; username: string; text?: string }
  | { kind: "email"; to: string; subject?: string; body?: string }
  | { kind: "sms"; to: string; body?: string }
  | { kind: "phone"; to: string }
> = {
  validateAndBuild(input) {
    const kind = z.object({ kind: z.enum(["whatsapp", "telegram", "email", "sms", "phone"]) }).parse(input).kind;
    if (kind === "whatsapp") {
      const parsed = z.object({ kind: z.literal("whatsapp"), phone: z.string(), text: z.string().optional() }).parse(input);
      const u = new URL(`https://wa.me/${parsed.phone.replace(/\D/g, "")}`);
      if (parsed.text) u.searchParams.set("text", parsed.text);
      return u.toString();
    }
    if (kind === "telegram") {
      const parsed = z.object({ kind: z.literal("telegram"), username: z.string(), text: z.string().optional() }).parse(input);
      const u = new URL(`https://t.me/${parsed.username.replace(/^@/, "")}`);
      if (parsed.text) u.searchParams.set("text", parsed.text);
      return u.toString();
    }
    if (kind === "email") {
      const parsed = z.object({
        kind: z.literal("email"),
        to: z.string().email(),
        subject: z.string().optional(),
        body: z.string().optional()
      }).parse(input);
      const u = new URL(`mailto:${parsed.to}`);
      if (parsed.subject) u.searchParams.set("subject", parsed.subject);
      if (parsed.body) u.searchParams.set("body", parsed.body);
      return u.toString();
    }
    if (kind === "sms") {
      const parsed = z.object({ kind: z.literal("sms"), to: z.string(), body: z.string().optional() }).parse(input);
      return `sms:${parsed.to}${parsed.body ? `?body=${encodeURIComponent(parsed.body)}` : ""}`;
    }
    const parsed = z.object({ kind: z.literal("phone"), to: z.string() }).parse(input);
    return `tel:${parsed.to}`;
  }
};

const socialBuilder: TypeBuilder<{ platform: "instagram" | "facebook" | "linkedin" | "tiktok" | "snapchat" | "reddit" | "x"; usernameOrUrl: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "snapchat", "reddit", "x"]),
      usernameOrUrl: z.string().min(1)
    }).parse(input);
    if (parsed.usernameOrUrl.startsWith("http")) {
      return sanitizeUrl(parsed.usernameOrUrl);
    }
    const root: Record<typeof parsed.platform, string> = {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      linkedin: "https://linkedin.com/in/",
      tiktok: "https://tiktok.com/@",
      snapchat: "https://snapchat.com/add/",
      reddit: "https://reddit.com/u/",
      x: "https://x.com/"
    };
    return `${root[parsed.platform]}${parsed.usernameOrUrl.replace(/^@/, "")}`;
  }
};

const videoBuilder: TypeBuilder<{ platform: "youtube" | "spotify" | "vimeo"; url: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({ platform: z.enum(["youtube", "spotify", "vimeo"]), url: z.string().url() }).parse(input);
    return `${parsed.platform.toUpperCase()}::${sanitizeUrl(parsed.url)}`;
  }
};

const googleBuilder: TypeBuilder<{ service: "forms" | "docs" | "sheets" | "reviews"; url: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({ service: z.enum(["forms", "docs", "sheets", "reviews"]), url: z.string().url() }).parse(input);
    return `GOOGLE_${parsed.service.toUpperCase()}::${sanitizeUrl(parsed.url)}`;
  }
};

const paymentBuilder: TypeBuilder<
  | { provider: "upi"; vpa: string; amount?: number; name?: string }
  | { provider: "paypal"; email: string; amount?: number; currency?: string }
  | { provider: "crypto"; network: string; address: string; amount?: number }
> = {
  validateAndBuild(input) {
    const provider = z.object({ provider: z.enum(["upi", "paypal", "crypto"]) }).parse(input).provider;
    if (provider === "upi") {
      const parsed = z.object({
        provider: z.literal("upi"),
        vpa: z.string(),
        amount: z.number().positive().optional(),
        name: z.string().optional()
      }).parse(input);
      const u = new URL("upi://pay");
      u.searchParams.set("pa", parsed.vpa);
      if (parsed.name) u.searchParams.set("pn", parsed.name);
      if (parsed.amount) u.searchParams.set("am", parsed.amount.toFixed(2));
      return u.toString();
    }
    if (provider === "paypal") {
      const parsed = z.object({
        provider: z.literal("paypal"),
        email: z.string().email(),
        amount: z.number().positive().optional(),
        currency: z.string().default("USD")
      }).parse(input);
      const u = new URL(`https://paypal.me/${parsed.email}`);
      if (parsed.amount) u.searchParams.set("amount", parsed.amount.toString());
      u.searchParams.set("currency", parsed.currency);
      return u.toString();
    }
    const parsed = z.object({
      provider: z.literal("crypto"),
      network: z.string(),
      address: z.string(),
      amount: z.number().positive().optional()
    }).parse(input);
    return `${parsed.network}:${parsed.address}${parsed.amount ? `?amount=${parsed.amount}` : ""}`;
  }
};

const couponBuilder: TypeBuilder<{
  code: string;
  campaign?: string;
  description?: string;
  redeemUrl?: string;
  expiresAt?: string;
  discount?: { type: "percent" | "amount"; value: number };
}> = {
  validateAndBuild(input) {
    const parsed = z.object({
      code: z.string().min(1).max(80),
      campaign: z.string().max(120).optional(),
      description: z.string().max(240).optional(),
      redeemUrl: z.string().url().optional(),
      expiresAt: z.string().datetime().optional(),
      discount: z.object({
        type: z.enum(["percent", "amount"]),
        value: z.number().positive()
      }).optional()
    }).parse(input);

    if (parsed.discount?.type === "percent" && parsed.discount.value > 100) {
      throw new Error("Percent discount cannot exceed 100.");
    }

    const payload = {
      code: parsed.code,
      campaign: parsed.campaign,
      description: parsed.description,
      redeemUrl: parsed.redeemUrl ? sanitizeUrl(parsed.redeemUrl) : undefined,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt).toISOString() : undefined,
      discount: parsed.discount
    };

    if (payload.redeemUrl) {
      assertProtocolAllowed(payload.redeemUrl);
    }

    return `COUPON::${JSON.stringify(payload)}`;
  }
};

const vcardBuilder: TypeBuilder<{ firstName: string; lastName?: string; org?: string; email?: string; phone?: string; url?: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      firstName: z.string(),
      lastName: z.string().optional(),
      org: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      url: z.string().url().optional()
    }).parse(input);
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${parsed.lastName ?? ""};${parsed.firstName};;;`,
      `FN:${[parsed.firstName, parsed.lastName].filter(Boolean).join(" ")}`,
      parsed.org ? `ORG:${parsed.org}` : "",
      parsed.email ? `EMAIL:${parsed.email}` : "",
      parsed.phone ? `TEL:${parsed.phone}` : "",
      parsed.url ? `URL:${sanitizeUrl(parsed.url)}` : "",
      "END:VCARD"
    ].filter(Boolean).join("\n");
  }
};

const calendarBuilder: TypeBuilder<{ title: string; start: string; end: string; description?: string; location?: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      title: z.string(),
      start: z.string().datetime(),
      end: z.string().datetime(),
      description: z.string().optional(),
      location: z.string().optional()
    }).parse(input);
    const fmt = (s: string) => s.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${parsed.title}`,
      `DTSTART:${fmt(parsed.start)}`,
      `DTEND:${fmt(parsed.end)}`,
      parsed.description ? `DESCRIPTION:${parsed.description}` : "",
      parsed.location ? `LOCATION:${parsed.location}` : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean).join("\n");
  }
};

const multiUrlBuilder: TypeBuilder<{ rules: Array<{ condition: string; url: string }>; fallback: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      rules: z.array(z.object({ condition: z.string(), url: z.string().url() })).min(1),
      fallback: z.string().url()
    }).parse(input);
    return `SMART_REDIRECT::${JSON.stringify({
      rules: parsed.rules.map((r) => ({ ...r, url: sanitizeUrl(r.url) })),
      fallback: sanitizeUrl(parsed.fallback)
    })}`;
  }
};

const linkListBuilder: TypeBuilder<{ title?: string; links: Array<{ label: string; url: string }> }> = {
  validateAndBuild(input) {
    const parsed = z.object({
      title: z.string().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1)
    }).parse(input);
    return `LINK_HUB::${JSON.stringify({
      title: parsed.title ?? "Links",
      links: parsed.links.map((x) => ({ ...x, url: sanitizeUrl(x.url) }))
    })}`;
  }
};

const bookingBuilder: TypeBuilder<{ platform: "amazon" | "etsy" | "booking" | "shopify"; url: string }> = {
  validateAndBuild(input) {
    const parsed = z.object({ platform: z.enum(["amazon", "etsy", "booking", "shopify"]), url: z.string().url() }).parse(input);
    return `${parsed.platform.toUpperCase()}::${sanitizeUrl(parsed.url)}`;
  }
};

const customBuilder: TypeBuilder<{ payload: string }> = {
  validateAndBuild(input) {
    return z.object({ payload: z.string().min(1).max(6000) }).parse(input).payload;
  }
};

const registry: Record<QRType, TypeBuilder<unknown>> = {
  url: urlBuilder as TypeBuilder<unknown>,
  app: appBuilder as TypeBuilder<unknown>,
  text: textBuilder as TypeBuilder<unknown>,
  map: mapBuilder as TypeBuilder<unknown>,
  wifi: wifiBuilder as TypeBuilder<unknown>,
  media: mediaBuilder as TypeBuilder<unknown>,
  document: documentBuilder as TypeBuilder<unknown>,
  message: messageBuilder as TypeBuilder<unknown>,
  social: socialBuilder as TypeBuilder<unknown>,
  video: videoBuilder as TypeBuilder<unknown>,
  google: googleBuilder as TypeBuilder<unknown>,
  payment: paymentBuilder as TypeBuilder<unknown>,
  coupon: couponBuilder as TypeBuilder<unknown>,
  vcard: vcardBuilder as TypeBuilder<unknown>,
  calendar: calendarBuilder as TypeBuilder<unknown>,
  "multi-url": multiUrlBuilder as TypeBuilder<unknown>,
  "link-list": linkListBuilder as TypeBuilder<unknown>,
  booking: bookingBuilder as TypeBuilder<unknown>,
  custom: customBuilder as TypeBuilder<unknown>
};

export function registerTypeBuilder(type: QRType | string, builder: TypeBuilder<unknown>): void {
  (registry as Record<string, TypeBuilder<unknown>>)[type] = builder;
}

export function buildPayload(type: QRType, data: unknown, ctx: BuilderContext): string {
  const builder = registry[type];
  if (!builder) throw new Error(`No builder registered for type: ${type}`);
  return builder.validateAndBuild(data, ctx);
}
