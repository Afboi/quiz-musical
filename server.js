// Servidor Bun: archivos estáticos + eventos en tiempo real mediante Server-Sent Events.
const encoder = new TextEncoder();
const clients = new Set();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".svg": "image/svg+xml"
};

function contentType(path) {
  const ext = path.match(/\.[^.\/]+$/)?.[0]?.toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

async function serveStatic(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return new Response("Bad request", { status: 400 }); }
  const safePath = decoded.replace(/^\/+/, "");
  if (safePath.split("/").includes("..")) return new Response("Forbidden", { status: 403 });
  const relative = safePath || "index.html";
  const file = Bun.file(`.${relative.startsWith("/") ? relative : `/${relative}`}`);
  if (!(await file.exists())) return new Response("No encontrado", { status: 404 });
  return new Response(file, { headers: { "Content-Type": contentType(relative), "Cache-Control": "no-cache" } });
}

Bun.serve({
  port: Number(process.env.PORT || 3000),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/events") {
      let client;
      const stream = new ReadableStream({
        start(controller) {
          client = controller;
          clients.add(client);
          controller.enqueue(encoder.encode(": conectado\n\n"));
        },
        cancel() { if (client) clients.delete(client); }
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" }
      });
    }
    if (url.pathname === "/api/event" && req.method === "POST") {
      let data;
      try { data = await req.json(); } catch { return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 }); }
      const encoded = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      for (const client of [...clients]) {
        try { client.enqueue(encoded); } catch { clients.delete(client); }
      }
      return Response.json({ ok: true });
    }
    if (url.pathname === "/api/health") return Response.json({ ok: true, clients: clients.size });
    return serveStatic(url.pathname);
  }
});

console.log(`🎵 Quiz Musical disponible en http://localhost:${process.env.PORT || 3000}`);
console.log(`🎛️ Controladora: http://localhost:${process.env.PORT || 3000}/controller.html`);
