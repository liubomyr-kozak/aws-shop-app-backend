export type AppConfig = { PRODUCT_API_BASE: string };

let _cfgPromise: Promise<AppConfig> | null = null;

export function loadConfig(): Promise<AppConfig> {
  if (_cfgPromise) return _cfgPromise;
  _cfgPromise = fetch("/config.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`config.json HTTP ${r.status}`);
      return r.json();
    })
    .then((cfg) => ({
      PRODUCT_API_BASE: String(cfg.PRODUCT_API_BASE || "").replace(/\/$/, ""),
    }))
    .catch(() => ({
      PRODUCT_API_BASE:
        (import.meta as any).env?.VITE_PRODUCT_API_URL?.replace(/\/$/, "") ||
        "",
    }));
  return _cfgPromise;
}
