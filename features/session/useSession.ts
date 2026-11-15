"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, errorMessage, UNAUTHORIZED_EVENT } from "../../lib/api";
import { toUser } from "../../lib/adapters";
import type { User, UserDto } from "../../types/domain";

// Quem está autenticado. A sessão vive em cookies httpOnly que o JavaScript não lê: pergunta-se
// sempre à API. Sem sessão a resposta é 401 e aparece o ecrã de entrada.
export type Session =
  | { status: "loading" }
  | { status: "anonymous"; notice: string }
  | { status: "authenticated"; user: User };

export function useSession() {
  const [session, setSession] = useState<Session>({ status: "loading" });

  useEffect(() => {
    let active = true;
    api<UserDto>("/auth/me")
      .then((me) => {
        if (active) setSession({ status: "authenticated", user: toUser(me) });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // 401 é o esperado sem sessão. Qualquer outro erro (rede, servidor) explica-se no ecrã de entrada.
        const expected = error instanceof ApiError && error.status === 401;
        setSession({ status: "anonymous", notice: expected ? "" : errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  // A sessão acabou noutro lado (a renovação falhou): volta-se ao ecrã de entrada.
  useEffect(() => {
    const ended = () => setSession({ status: "anonymous", notice: "" });
    window.addEventListener(UNAUTHORIZED_EVENT, ended);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, ended);
  }, []);

  const signIn = useCallback(
    (user: User) => setSession({ status: "authenticated", user }),
    [],
  );

  const updateUser = useCallback(
    (user: User) =>
      setSession((current) =>
        current.status === "authenticated" ? { status: "authenticated", user } : current,
      ),
    [],
  );

  // A API revoga a sessão e limpa os cookies. Se falhar, sai-se na mesma deste lado.
  const signOut = useCallback(() => {
    api("/auth/logout", { method: "POST" }).catch(() => {});
    setSession({ status: "anonymous", notice: "" });
  }, []);

  return { session, signIn, updateUser, signOut };
}
