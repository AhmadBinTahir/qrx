export type QRType =
  | "url"
  | "app"
  | "text"
  | "map"
  | "wifi"
  | "media"
  | "document"
  | "message"
  | "social"
  | "video"
  | "google"
  | "payment"
  | "coupon"
  | "vcard"
  | "calendar"
  | "multi-url"
  | "link-list"
  | "booking"
  | "custom";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type DotStyle = "square" | "rounded" | "diamond" | "classy" | "extra-rounded";
export type CornerStyle = "square" | "rounded" | "extra-rounded" | "classy";
export type RenderFormat = "svg" | "png" | "canvas";

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientStyle {
  type?: "linear" | "radial";
  angle?: number;
  stops: GradientStop[] | string[];
}

export interface BackgroundStyle {
  color?: string;
  transparent?: boolean;
  image?: {
    src: string;
    opacity?: number;
    fit?: "cover" | "contain";
  };
  pattern?: "none" | "dots" | "grid";
}

export interface QRStyle {
  dots?: DotStyle;
  corners?: CornerStyle;
  foreground?: string;
  background?: string;
  gradient?: string[] | GradientStop[] | GradientStyle;
  backgroundStyle?: BackgroundStyle;
  transparentBackground?: boolean;
  shadow?: { blur?: number; color?: string; dx?: number; dy?: number };
  glow?: { color: string; strength?: number };
  blur?: number;
  shapeMask?: "circle" | "heart" | "none" | string;
  cornerColor?: string;
  eyeInnerColor?: string;
  theme?: "neon" | "minimal" | "corporate" | "classic" | "midnight" | "ocean" | "sunset" | "forest";
}

export interface LogoOptions {
  src: string;
  size?: number;
  borderRadius?: number;
  padding?: number;
  background?: string;
  preserveAspectRatio?: string;
}

export interface SecurityOptions {
  strictProtocolWhitelist?: string[];
  warnUnsafe?: boolean;
  blockUnsafe?: boolean;
  encrypt?: boolean;
  password?: string;
  expiresAt?: string;
  token?: string;
  sign?: boolean;
  signingSecret?: string;
}

export interface CoreOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
  margin?: number;
  scale?: number;
  version?: number;
  maskPattern?: number;
}

export interface ValidationOptions {
  minReadabilityScore?: number;
  failOnWarnings?: boolean;
  failOnUnsafe?: boolean;
}

export interface GenerateQROptions<TData = unknown> {
  type: QRType;
  data: TData;
  style?: QRStyle;
  logo?: LogoOptions;
  security?: SecurityOptions;
  core?: CoreOptions;
  format?: RenderFormat;
  validation?: ValidationOptions;
  meta?: Record<string, unknown>;
}

export interface PayloadInspection {
  type: QRType;
  payload: string;
  normalizedData: unknown;
  warnings: string[];
}

export interface ValidationReport {
  readable: boolean;
  score: number;
  contrastScore: number;
  densityScore: number;
  warnings: string[];
  recommendations: string[];
}

export interface QRArtifact {
  payload: string;
  warnings: string[];
  score: number;
  matrixSize: number;
  version: number;
  validation: ValidationReport;
  svg?: string;
  png?: Buffer;
}

export interface BuilderContext {
  type: QRType;
}

export interface TypeBuilder<T = unknown> {
  validateAndBuild: (input: T, ctx: BuilderContext) => string;
}

export interface MiddlewareContext {
  options: GenerateQROptions;
  payload: string;
  normalizedData?: unknown;
  warnings: string[];
}

export type Middleware = (ctx: MiddlewareContext) => Promise<MiddlewareContext> | MiddlewareContext;

export interface Renderer {
  name: RenderFormat | string;
  render: (args: {
    matrix: boolean[][];
    options: GenerateQROptions;
    payload: string;
    size: number;
  }) => Promise<string | Buffer | undefined> | string | Buffer | undefined;
}

export interface GeneratorConfig {
  defaults?: Partial<GenerateQROptions>;
  strict?: boolean;
  protocolWhitelist?: string[];
}
