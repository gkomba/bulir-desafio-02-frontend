// O navegador só fala com este domínio: os pedidos a /v1/* são reencaminhados para a API.
// Assim os cookies de sessão (httpOnly, SameSite=Strict) são do mesmo site e funcionam, e a API
// não precisa de CORS. Os caminhos mantêm-se iguais, porque o cookie de refresh só vale para /v1/auth.
const API_URL = process.env.API_URL ?? "http://localhost:3000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/v1/:path*", destination: `${API_URL}/v1/:path*` }];
  },
};

export default nextConfig;
