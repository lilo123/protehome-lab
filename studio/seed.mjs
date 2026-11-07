// One-time import: copies the content currently baked into index.html into the Sanity dataset,
// so the Studio starts pre-filled. Usage:
//   SANITY_PROJECT_ID=xxx SANITY_TOKEN=yyy node seed.mjs
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'
import {LexoRank} from 'lexorank'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'sdzmmkh2',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.config/sanity/config.json'), 'utf8')).authToken,
  apiVersion: '2025-02-19',
  useCdn: false,
})

let k = 0
const key = () => `k${(++k).toString(36)}${Math.random().toString(36).slice(2, 7)}`

// ---- tiny HTML -> Portable Text converter for the essay markup in index.html ----
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
function inline(html) {
  // returns children spans, handling <strong>, <em> (possibly nested)
  const children = []
  const re = /<(\/?)(strong|em)>|([^<]+)|<[^>]+>/g
  const marks = []
  let m
  while ((m = re.exec(html))) {
    if (m[2]) {
      if (m[1]) marks.splice(marks.lastIndexOf(m[2]), 1)
      else marks.push(m[2])
    } else if (m[3]) {
      const text = decode(m[3].replace(/\s+/g, ' '))
      if (text) children.push({_type: 'span', _key: key(), text, marks: [...marks]})
    }
  }
  if (children.length) {
    children[0].text = children[0].text.replace(/^\s+/, '')
    children[children.length - 1].text = children[children.length - 1].text.replace(/\s+$/, '')
  }
  return children.length ? children : [{_type: 'span', _key: key(), text: '', marks: []}]
}
const block = (style, html, extra = {}) => ({_type: 'block', _key: key(), style, markDefs: [], children: inline(html), ...extra})

function essayBody(prose) {
  const out = []
  const re = /<(p|h2|ul|blockquote|aside)([^>]*)>([\s\S]*?)<\/\1>/g
  let m
  while ((m = re.exec(prose))) {
    const [, tag, , inner] = m
    if (tag === 'p') out.push(block('normal', inner))
    else if (tag === 'h2') out.push(block('h2', inner))
    else if (tag === 'blockquote') {
      const [quote, small] = inner.split(/<small>/)
      out.push(block('blockquote', quote))
      if (small) out.push(block('normal', `<em>${small.replace(/<\/small>/, '')}</em>`))
    } else if (tag === 'ul') {
      for (const li of inner.matchAll(/<li>([\s\S]*?)<\/li>/g)) out.push(block('normal', li[1], {listItem: 'bullet', level: 1}))
    } else if (tag === 'aside') {
      const heading = decode((/<span class="k">([\s\S]*?)<\/span>/.exec(inner) || [, ''])[1])
      const paras = [...inner.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => decode(p[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()))
      out.push({_type: 'callout', _key: key(), heading, text: paras.join('\n\n')})
    }
  }
  return out
}

async function upload(file) {
  const asset = await client.assets.upload('image', fs.createReadStream(path.join(root, file)), {filename: path.basename(file)})
  return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const prose = /<div class="prose" id="prose">([\s\S]*?)\n      <\/div>\n\n      <div class="article-end">/.exec(html)[1]

const lab = {
  _id: 'labInfo',
  _type: 'labInfo',
  labName: 'Nguyen Atom Protehome Lab',
  tagline: 'Protein Homeostasis & Therapeutic Discovery',
  vision: 'Understanding and engineering protein homeostasis at molecular and atomic resolution to advance human health.',
  about:
    'Led by Nguyen Van Thang, the lab is based at the College of Health Sciences, VinUniversity. We study how cells decide the fate of their proteins, from ubiquitin signalling to targeted degradation, and turn that understanding into new therapeutic strategies.',
  piProfileUrl: 'https://vinuni.edu.vn/people/nguyen-van-thang/',
  scholarUrl: 'https://scholar.google.com/citations?user=8qWl300AAAAJ',
  pillars: [
    ['Post-Translational Modifications, with a focus on Ubiquitin Biology', 'E3 ligases, deubiquitylating enzymes (DUBs), and the molecular regulation of protein fate.', ['E3 ligases', 'DUBs', 'Ubiquitin code']],
    ['Targeted Protein Degradation', 'Molecular glues, PROTACs, and therapeutic strategies for selective protein degradation.', ['Molecular glues', 'PROTACs']],
    ['Proteostasis', 'Protein quality control, protein turnover, and cellular homeostasis.', ['Quality control', 'Turnover']],
    ['Atomic Biology', 'Molecular mechanisms, structural biology, and protein engineering at atomic resolution.', ['Structural biology', 'Protein engineering']],
    ['Therapeutic Discovery', 'Next-generation therapeutic interventions for cancer, viral pathogens, neurodegeneration, and aging-associated diseases.', ['Cancer', 'Viral pathogens', 'Neurodegeneration', 'Aging']],
  ].map(([title, description, tags]) => ({_type: 'pillar', _key: key(), title, description, tags})),
  contactEmail: 'thang.nv3@vinuni.edu.vn',
  contactPhone: '+84 333 435 917',
  address: 'College of Health Sciences, VinUniversity',
}

const peopleRaw = [
  ['Nguyen Van Thang', 'Principal Investigator', 'thang.nv3@vinuni.edu.vn'],
  ['Do Thi Hoai Thu', 'Postdoctoral Researcher', 'thu.dth@vinuni.edu.vn'],
  ['Nguyen Quynh Nhu', 'Undergraduate Researcher', '24nhu.nq@vinuni.edu.vn'],
  ['Doan Vinh Khanh', 'Undergraduate Researcher', '25khanh.dv@vinuni.edu.vn'],
  ['Pham Do Thai An', 'Undergraduate Researcher', '25an.pdt@vinuni.edu.vn'],
  ['Nguyen Khoi Nguyen', 'Undergraduate Researcher', '24nguyen.nk@vinuni.edu.vn'],
  ['Mai Nguyen Anh Vu', 'Collaborator', null],
]
let rank = LexoRank.min()
const people = peopleRaw.map(([name, role, email], i) => {
  rank = rank.genNext().genNext()
  return {_id: `person-${i + 1}`, _type: 'person', name, role, status: 'current', ...(email ? {email} : {}), orderRank: rank.toString()}
})
rank = rank.genNext().genNext()
people.push({
  _id: 'person-alumni-1', _type: 'person', name: 'Vu Minh Tri', role: 'Undergraduate Researcher', status: 'alumni',
  alumniYear: '2026', alumniNow: 'Undergraduate Student, University of Minnesota', orderRank: rank.toString(),
})

const news = {
  _id: 'news-atomic-biology-seminar',
  _type: 'news',
  date: '2026-11-01',
  type: 'Seminar',
  kicker: 'Work-in-Progress Seminar',
  title: 'Atomic Biology: Engineering Life at the Resolution of Atoms',
  text:
    'This talk introduces Atomic Biology as an emerging interdisciplinary field integrating structural biology, chemistry, AI, quantum physics, advanced imaging, and synthetic biology to understand, predict, design, and engineer biological functions at the atomic level. It explores its potential to transform future medicine while highlighting the key challenge of translating atomic-level molecular designs into predictable, experimentally validated functions in living systems.',
}

const cover = await upload('assets/writing.webp')
const essay = {
  _id: 'essay-glp-1',
  _type: 'essay',
  title: 'Từ Nọc Độc Thằn Lằn Sa Mạc Đến Cuộc Cách Mạng GLP-1 Trong Điều Trị Đái Tháo Đường Và Béo Phì: Vì Sao Khoa Học Cơ Bản Quan Trọng?',
  slug: {_type: 'slug', current: 'glp-1'},
  date: '2026-06-01',
  language: 'vi',
  cover,
  excerpt:
    'Từ một peptide được tìm thấy trong nọc độc của loài thằn lằn Gila sống giữa sa mạc, nhân loại đã phát triển nên Ozempic, Wegovy và Mounjaro. Câu chuyện GLP-1 là minh chứng điển hình cho giá trị lâu dài của khoa học cơ bản.',
  body: essayBody(prose),
}

const tx = client.transaction()
for (const doc of [lab, ...people, news, essay]) tx.createOrReplace(doc)
const res = await tx.commit()
console.log('Imported', res.results.length, 'documents; essay blocks:', essay.body.length)
