import type { ImageHostingProvider } from "@/services/image-hosting-configs";

export type ImageHostingConfigDialogMode = "create" | "view";

export interface ImageHostingConfigFormState {
  provider: ImageHostingProvider | "";
  config: Record<string, string>;
}
