import { copyFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const from = resolve(root, "src/exscroll.css")
const to = resolve(root, "dist/exscroll.css")

await mkdir(dirname(to), { recursive: true })
await copyFile(from, to)
console.log("dist/exscroll.css")
