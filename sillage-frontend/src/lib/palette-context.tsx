"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type PaletteId = "noir-chic" | "violeta-sensual" | "minimal-light";

type PaletteTokens = Record<string, string>;

type PaletteDefinition = {
  id: PaletteId;
  label: string;
  tokens: PaletteTokens;
  bodyClassName: string;
};

type PaletteContextValue = {
  activePalette: PaletteDefinition;
  palettes: PaletteDefinition[];
  setActivePalette: (paletteId: PaletteId) => void;
  cyclePalette: () => void;
};

const STORAGE_KEY = "sillage:palette";

const PALETTES: PaletteDefinition[] = [
  {
    id: "noir-chic",
    label: "Noir Chic",
    bodyClassName: "noir-chic",
    tokens: {
      background: "0 0% 4%",
      foreground: "0 0% 96%",
      primary: "46 65% 52%",
      primaryForeground: "0 0% 10%",
      secondary: "0 0% 30%",
      secondaryForeground: "0 0% 92%",
      accent: "46 65% 52%",
      accentForeground: "0 0% 10%",
      muted: "0 0% 18%",
      mutedForeground: "0 0% 72%",
      border: "0 0% 20%",
      input: "0 0% 18%",
      ring: "46 65% 52%",
      bgAlt: "0 0% 7%",
      bgSoft: "0 0% 12%",
      textMuted: "0 0% 70%",
      block: "0 0% 12%",
      navSurface: "0 0% 8%",
      navBorder: "46 65% 35%"
    }
  },
  {
    id: "violeta-sensual",
    label: "Violeta Sensual",
    bodyClassName: "violeta-sensual",
    tokens: {
      background: "267 27% 24%",
      foreground: "0 0% 99%",
      primary: "262 46% 80%",
      primaryForeground: "267 27% 18%",
      secondary: "322 35% 91%",
      secondaryForeground: "262 46% 24%",
      accent: "262 46% 80%",
      accentForeground: "267 27% 18%",
      muted: "267 21% 35%",
      mutedForeground: "262 36% 87%",
      border: "267 24% 32%",
      input: "267 24% 32%",
      ring: "262 46% 80%",
      bgAlt: "267 23% 29%",
      bgSoft: "267 22% 34%",
      textMuted: "322 24% 78%",
      block: "267 20% 30%",
      navSurface: "267 27% 22%",
      navBorder: "262 46% 60%"
    }
  },
  {
    id: "minimal-light",
    label: "Minimal Light",
    bodyClassName: "minimal-light",
    tokens: {
      background: "40 30% 96%",
      foreground: "0 0% 17%",
      primary: "7 39% 74%",
      primaryForeground: "0 0% 12%",
      secondary: "35 10% 62%",
      secondaryForeground: "0 0% 15%",
      accent: "7 39% 74%",
      accentForeground: "0 0% 18%",
      muted: "35 20% 78%",
      mutedForeground: "0 0% 34%",
      border: "35 14% 80%",
      input: "35 14% 80%",
      ring: "7 39% 64%",
      bgAlt: "40 28% 92%",
      bgSoft: "40 26% 88%",
      textMuted: "35 7% 45%",
      block: "40 20% 94%",
      navSurface: "40 30% 98%",
      navBorder: "7 39% 68%"
    }
  }
];

const PaletteContext = createContext<PaletteContextValue | undefined>(undefined);

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function applyPalette(tokens: PaletteTokens) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  for (const [token, value] of Object.entries(tokens)) {
    if (typeof value !== "string" || value.length === 0) {
      continue;
    }

    const cssVariableName = `--${toKebabCase(token)}`;
    root.style.setProperty(cssVariableName, value);
  }
}

function getInitialPalette(): PaletteDefinition {
  if (typeof window === "undefined") {
    return PALETTES[0];
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as PaletteId | null;
  const match = PALETTES.find((palette) => palette.id === stored);
  return match ?? PALETTES[0];
}

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState<PaletteDefinition>(() => getInitialPalette());
  const previousPalette = useRef<PaletteDefinition | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    applyPalette(palette.tokens);
    document.body.classList.add(palette.bodyClassName);
    window.localStorage.setItem(STORAGE_KEY, palette.id);

    if (previousPalette.current && previousPalette.current.bodyClassName !== palette.bodyClassName) {
      document.body.classList.remove(previousPalette.current.bodyClassName);
    }

    previousPalette.current = palette;
  }, [palette]);

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") {
        return;
      }

      if (previousPalette.current) {
        document.body.classList.remove(previousPalette.current.bodyClassName);
      }
    };
  }, []);

  const setActivePalette = useCallback((paletteId: PaletteId) => {
    const next = PALETTES.find((item) => item.id === paletteId);
    if (next) {
      setPalette(next);
    }
  }, []);

  const cyclePalette = useCallback(() => {
    setPalette((current) => {
      const index = PALETTES.findIndex((item) => item.id === current.id);
      const nextIndex = (index + 1) % PALETTES.length;
      return PALETTES[nextIndex];
    });
  }, []);

  const value = useMemo<PaletteContextValue>(
    () => ({
      activePalette: palette,
      palettes: PALETTES,
      setActivePalette,
      cyclePalette
    }),
    [palette, setActivePalette, cyclePalette]
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const context = useContext(PaletteContext);

  if (!context) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }

  return context;
}

export { applyPalette };
