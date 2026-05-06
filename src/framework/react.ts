import type { GenerateQROptions } from "../types.js";
import { generateQR } from "../index.js";

export interface QrxReactProps extends GenerateQROptions {
  className?: string;
}

export async function createReactSvgProps(props: QrxReactProps): Promise<{ dangerouslySetInnerHTML: { __html: string }; className?: string }> {
  const out = await generateQR({ ...props, format: "svg" });
  return {
    dangerouslySetInnerHTML: { __html: out.svg ?? "" },
    className: props.className
  };
}
