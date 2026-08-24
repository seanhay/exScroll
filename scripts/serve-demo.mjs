import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const port = Number(process.env["PORT"] ?? 5173)

const types = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".map": "application/json",
}

createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", "http://localhost")
	const path = url.pathname === "/" ? "/demo/index.html" : url.pathname
	// Keep the server inside the project directory.
	const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ""))

	try {
		const body = await readFile(file)
		res.writeHead(200, {
			"content-type": types[extname(file)] ?? "application/octet-stream",
			"cache-control": "no-store",
		})
		res.end(body)
	} catch {
		res.writeHead(404, { "content-type": "text/plain" })
		res.end("Not found")
	}
}).listen(port, () => console.log(`http://localhost:${port}/`))
