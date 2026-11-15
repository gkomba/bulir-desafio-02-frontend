import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A API limita os logins a 5 por minuto (por IP). Os testes fazem vários: antes de cada um espera-se
// por uma vaga, para a suite não falhar por causa do limite e sem alterar a API. Usa-se 4 e não 5,
// para sobrar uma margem.
//
// As tentativas guardam-se num ficheiro temporário e não só em memória: o limite é da API e vale
// para todas as execuções, por isso uma execução tem de saber dos logins da anterior (outro
// processo, feito há poucos segundos).
const LIMIT = 4;
const WINDOW_MS = 61_000;
const FILE = join(tmpdir(), "bulir-e2e-logins.json");

const readAttempts = (): number[] => {
  if (!existsSync(FILE)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
};

export async function waitForLoginSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    const recent = readAttempts().filter((time) => now - time <= WINDOW_MS);
    if (recent.length < LIMIT) {
      writeFileSync(FILE, JSON.stringify([...recent, now]));
      return;
    }
    const oldest = Math.min(...recent);
    await new Promise((resolve) => setTimeout(resolve, oldest + WINDOW_MS - now + 50));
  }
}
