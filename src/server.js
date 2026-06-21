import dns from "node:dns";
import { startServer } from "./app.js";

// Algunos DNS de ISP rechazan las consultas SRV que usa mongodb+srv://
// (error "querySrv ECONNREFUSED"). Forzamos resolvers públicos confiables
// (Cloudflare/Google) para que la resolución del cluster de Atlas no dependa
// del DNS del proveedor. Se puede sobreescribir con DNS_SERVERS="1.1.1.1,8.8.8.8".
const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,1.0.0.1,8.8.8.8,8.8.4.4")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

try {
  dns.setServers(dnsServers);
} catch (err) {
  console.warn("No se pudieron configurar los DNS servers:", err.message);
}

startServer();
