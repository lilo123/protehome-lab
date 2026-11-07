// Creates a Sanity organization (needed before creating a project) using the CLI login token.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
const headers = {Authorization: `Bearer ${cfg.authToken}`, 'Content-Type': 'application/json'}
const base = 'https://api.sanity.io/v2021-06-07'
const existing = await (await fetch(`${base}/organizations`, {headers})).json()
if (Array.isArray(existing) && existing.length) {
  console.log(JSON.stringify(existing.map((o) => ({id: o.id, name: o.name}))))
} else {
  const res = await fetch(`${base}/organizations`, {method: 'POST', headers, body: JSON.stringify({name: process.argv[2] || 'Nguyen Atom Protehome Lab'})})
  const body = await res.json()
  console.log(res.status, JSON.stringify({id: body.id, name: body.name, error: body.error || body.message}))
}
