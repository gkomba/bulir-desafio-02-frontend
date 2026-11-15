// A API limita os logins a 5 por minuto (por IP). Os testes fazem vários: antes de cada um espera-se
// por uma vaga, para a suite não falhar por causa do limite e sem alterar a API. Usa-se 4 e não 5,
// para sobrar uma margem (por exemplo, para logins feitos por outro processo há pouco tempo).
const LIMIT = 4;
const WINDOW_MS = 61_000;
const attempts: number[] = [];

export async function waitForLoginSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (attempts.length > 0 && now - (attempts[0] as number) > WINDOW_MS) attempts.shift();
    if (attempts.length < LIMIT) {
      attempts.push(now);
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, (attempts[0] as number) + WINDOW_MS - now + 50),
    );
  }
}
