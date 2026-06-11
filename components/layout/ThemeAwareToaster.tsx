"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function ThemeAwareToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    function read() {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return <Toaster theme={theme} position="top-right" richColors />;
}
