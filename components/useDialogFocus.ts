"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Ao abrir um diálogo, leva o foco para dentro dele; com Tab, o foco não sai; ao fechar, devolve-o a
// quem o abriu. Sem isto, quem navega com o teclado ou com um leitor de ecrã fica perdido por trás.
export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusable().at(0) ?? node)?.focus();

    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items.at(0);
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    node?.addEventListener("keydown", keepFocusInside);
    return () => {
      node?.removeEventListener("keydown", keepFocusInside);
      opener?.focus();
    };
  }, []);

  return ref;
}
