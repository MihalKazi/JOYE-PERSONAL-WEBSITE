/**
 * Loads Joye's real content (the "Personal Website" folder + her CV) into the CMS,
 * replacing the placeholder gallery and sample post.
 *
 * Run: pnpm payload run scripts/import-content.ts
 *      ... --force   (run even if real works already exist — deletes ALL works first)
 *
 * Images are auto-rotated and downsized (max 2400px, JPEG) before upload; HEIC photos are
 * decoded with ffmpeg; .MOV videos are transcoded to web MP4 (ffmpeg must be on PATH).
 * Skipped on purpose: exact duplicates (photo of a drawing next to its clean scan, near-identical
 * stage shots) and a festival logo graphic.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'

const SRC = path.resolve(process.cwd(), '../Personal Website/Personal Website')
const TMP = path.join(os.tmpdir(), 'joye-import')
const force = process.argv.includes('--force')
const PLACEHOLDER = 'Placeholder — replace with the real work.'

// ---------- rich text helpers (Lexical JSON) ----------
type Seg = { t: string; i?: boolean; b?: boolean; url?: string | null }
const textNode = (text: string, format = 0) => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 })
const paragraphFrom = (segs: Seg[]) => {
  const children: Record<string, unknown>[] = []
  for (const s of segs) {
    const node = textNode(s.t, (s.b ? 1 : 0) | (s.i ? 2 : 0))
    const last = children[children.length - 1] as { type?: string; fields?: { url?: string }; children?: unknown[] } | undefined
    if (s.url) {
      if (last?.type === 'link' && last.fields?.url === s.url) last.children!.push(node)
      else
        children.push({
          type: 'link',
          version: 3,
          fields: { linkType: 'custom', url: s.url, newTab: true },
          format: '',
          indent: 0,
          direction: 'ltr',
          children: [node],
        })
    } else children.push(node)
  }
  return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '', children }
}
const richText = (paras: Seg[][]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: paras.map(paragraphFrom) },
})

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(m)

  // ---------- guard ----------
  const works = await payload.find({ collection: 'works', limit: 500, depth: 0 })
  const real = works.docs.filter((w) => w.description !== PLACEHOLDER)
  if (real.length && !force) {
    log(`${real.length} real works already exist — nothing done. Re-run with --force to replace ALL works.`)
    process.exit(0)
  }

  // ---------- remove placeholders ----------
  log('Removing placeholder works, images and sample post…')
  for (const w of works.docs) await payload.delete({ collection: 'works', id: w.id })
  await payload.delete({ collection: 'media', where: { alt: { contains: '(placeholder image)' } } })
  await payload.delete({ collection: 'posts', where: { slug: { equals: 'sample-post' } } })

  // ---------- upload helper ----------
  fs.mkdirSync(TMP, { recursive: true })
  let n = 0
  const upload = async (rel: string, alt: string, opts: { rotate?: number } = {}) => {
    let src = path.join(SRC, rel)
    if (/\.pdf$/i.test(rel)) return payload.create({ collection: 'media', data: { alt }, filePath: src })
    if (/\.heic$/i.test(rel)) {
      const dec = path.join(TMP, `heic-${++n}.jpg`)
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-frames:v', '1', '-q:v', '2', dec])
      src = dec
    }
    const out = path.join(TMP, `${String(++n).padStart(3, '0')}-${path.basename(rel).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`)
    let img = sharp(src).rotate()
    if (opts.rotate) img = sharp(await img.toBuffer()).rotate(opts.rotate)
    await img
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(out)
    return payload.create({ collection: 'media', data: { alt }, filePath: out })
  }

  /** Transcode a phone video to web MP4 and upload it; also returns a cover frame. */
  const uploadVideo = async (rel: string, alt: string, coverAt: number, height: number) => {
    const src = path.join(SRC, rel)
    const base = path.basename(rel).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const mp4 = path.join(TMP, `${base}.mp4`)
    const cover = path.join(TMP, `${base}-cover.jpg`)
    log(`  transcoding ${path.basename(rel)}…`)
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-map', '0:v:0', '-map', '0:a:0?', '-vf', `scale=-2:${height}`,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4])
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(coverAt), '-i', src, '-frames:v', '1', '-q:v', '2', cover])
    const video = await payload.create({ collection: 'media', data: { alt }, filePath: mp4 })
    const poster = await payload.create({ collection: 'media', data: { alt }, filePath: cover })
    return { video, poster }
  }

  // ---------- works ----------
  const P = 'Creative Work/performances'
  const D = 'Creative Work/Drawings'
  const PH = 'Creative Work/photograph for website'
  type W = {
    title: string
    category: 'performance' | 'drawings' | 'photography'
    year?: number
    description?: string
    main: [string, string]
    more?: [string, string][]
    /** [file, alt, cover time (s), output height]. Without a main image, the cover frame is used. */
    video?: [string, string, number, number]
  }

  const kathak: W = {
    title: 'National Kathak Dance Fest',
    category: 'performance',
    year: 2024,
    description: 'Kathak classical dance, performed with Kathak Nritra Sampradaya at the National Kathak Dance Fest.',
    main: [`${P}/National Kathak Dance fest 2024/MHGE0099.JPG`, 'Joye in Kathak costume and jewellery, lit by warm side light'],
    more: [
      [`${P}/National Kathak Dance fest 2024/IMG_0030.JPEG`, 'Kathak dancers in a line on a dark stage'],
      [`${P}/National Kathak Dance fest 2024/IMG_0214.JPEG`, 'Kathak ensemble on stage in coloured costumes'],
      [`${P}/National Kathak Dance fest 2024/IMG_0216.JPEG`, 'Kathak ensemble moving through stage haze'],
      [`${P}/National Kathak Dance fest 2024/IMG_0255.JPEG`, 'The full Kathak company seated on stage after the performance'],
      [`${P}/National Kathak Dance fest 2024/IMG_8961.JPG`, 'Dancers backstage in Kathak costume'],
      [`${P}/National Kathak Dance fest 2024/IMG_9311.JPG`, 'Two Kathak dancers on a large stage'],
      [`${P}/National Kathak Dance fest 2024/IMG_9338.JPG`, 'Kathak dancers mid-turn under stage lights'],
    ],
  }
  const dhoratol: W = {
    title: 'Dhoratol Nritto',
    category: 'performance',
    year: 2024,
    description:
      'Lead choreographer and director. An original production incorporating indigenous martial and mask dance forms of Greater Bengal (Chhau, Raibenshe, Lathi Khela), showcased at the Event Box Competition, KHUET Inter-University Dance Fest and the University of Dhaka Central “Basanta Utsab”.',
    main: [`${P}/DUCS/New folder/Production Dhoratal Nritta.jpeg`, 'Dhoratol Nritto: dancers on stage under kites and a painted backdrop'],
    more: [
      [`${P}/DUCS/New folder/Cho Nritto.jpg`, 'Chhau mask dancers in Dhoratol Nritto'],
      [`${P}/DUCS/New folder/Dhak Ntritta.jpg`, 'The Dhoratol Nritto cast in red and white with Chhau masks'],
      [`${P}/DUCS/New folder/Ray_beshe_ Team.jpeg`, 'The Raibenshe team rehearsing with sticks'],
    ],
  }
  const narir: W = {
    title: 'Narir July',
    category: 'performance',
    year: 2025,
    description: 'Theatre artist in the stage production “Narir July” at the Indomitable Women’s Award 2025.',
    main: [`${P}/Indomitable Women’s Award 2025_ Narir July/VHNM7154.JPG`, 'Narir July: performers lift a figure through red smoke'],
    more: [
      [`${P}/Indomitable Women’s Award 2025_ Narir July/EBRD1035.JPG`, 'Narir July ensemble linking hands on a red stage'],
      [`${P}/Indomitable Women’s Award 2025_ Narir July/IMG_9028.JPG`, 'A performer rises from a red cloth with protest placards'],
      [`${P}/Indomitable Women’s Award 2025_ Narir July/WZRD8548.JPG`, 'The Narir July cast taking a bow'],
    ],
  }
  const dakghar: W = {
    title: 'Dakghar (The Post Office)',
    category: 'performance',
    year: 2023,
    description:
      'Played Amal, the lead, in Rabindranath Tagore’s Dakghar, directed by Rabeya Rabu and staged multiple times. Read “Playing Amal: A Boy at the Window and Me” on the blog.',
    main: [`${P}/Dhakghor/IIGL3812.JPG`, 'Dakghar: Amal at the window on a purple-lit stage'],
    more: [
      [`${P}/Dhakghor/BMBR6660.JPG`, 'Dakghar: Amal talks with a passer-by'],
      [`${P}/Dhakghor/DBQV1786.JPG`, 'Dakghar: a scene in the courtyard'],
      [`${P}/Dhakghor/IMG_7117.JPG`, 'Dakghar: two actors on a dark stage'],
      [`${P}/Dhakghor/IMG_7132.JPG`, 'Dakghar: Amal and the headman, black and white'],
      [`${P}/Dhakghor/IMG_7375.JPG`, 'Dakghar: the full stage set'],
    ],
  }
  const ducs: W = {
    title: 'Dhaka University Cultural Society productions',
    category: 'performance',
    year: 2024,
    description:
      'As Dance Coordinator of the Dhaka University Cultural Society (2024–25), directed and choreographed productions for seven major events.',
    main: [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/IMG_7402.JPG`, 'Three dancers in a dramatic scene on a dark stage'],
    more: [
      [`${P}/DUCS/481775295_1067493862075836_2679857918845610322_n.jpg`, 'Joye dancing in red at a Dhaka University cultural event'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/481101725_1065860258905863_8983705937035853743_n.jpg`, 'Dancers in white performing outdoors with singers'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/481343472_1067493698742519_8587025706033356959_n.jpg`, 'A dancer in red at a Rabindra–Nazrul evening'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/482023245_1065860255572530_9160844624748696907_n.jpg`, 'Two dancers kneeling during an outdoor performance'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/486334572_1082678483890707_5961011992100696188_n.jpg`, 'Dancers with puppets in red costumes'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/IMG_1840.JPG`, 'Performers posing in a painted stage frame at night'],
      [`${P}/DUCS/Dhaka University Cultural Scoiety_ Production_photo Archive/IMG_7394.JPG`, 'A pair of dancers in yellow before a sun backdrop'],
      [`${P}/DUCS/IMG_1786.JPG`, 'Dancers under purple stage light'],
      [`${P}/DUCS/IMG_7378.JPG`, 'Two dancers in yellow and red before a painted sun'],
      [`${P}/DUCS/IMG_7384.JPG`, 'A dancer reaches toward her partner under a painted sun'],
    ],
    video: [`${P}/DUCS/IMG_7349.MOV`, 'Video: a Dhaka University Cultural Society dance production on stage', 20, 720],
  }

  const drawing = (title: string, file: string, alt: string): W => ({ title, category: 'drawings', main: [`${D}/${file}`, alt] })
  const photo = (title: string, file: string, alt: string, year?: number, more?: [string, string][]): W => ({
    title,
    category: 'photography',
    year,
    main: [`${PH}/${file}`, alt],
    more,
  })

  // Interleaved so every row of the gallery mixes performance, drawing and photography.
  const list: W[] = [
    kathak,
    drawing('Hollow Woods of Women', 'Hollow Woods of Women.png', 'Blue ink drawing: a woman’s profile filled with trees and a deer'),
    photo('Gayibi Janaja', 'July Uprising/Gayibi Janaja.JPG', 'Absentee funeral prayers under a great tree, coffins draped in flags', 2024),
    dhoratol,
    drawing('Shade of a Mind', 'Shade of a Mind.JPG', 'Painting of a tree shaped like a brain in a desert'),
    photo('The piece of sky', 'Black and white/The piece of sky.JPG', 'Black-and-white sky of heavy clouds over a dark skyline'),
    narir,
    drawing('Quilted', 'Quilted.JPG', 'Painting of two embracing figures in a patterned quilt'),
    photo('Days in Internet Blackout', 'July Uprising/Days in Internet Blackout.jpg', 'Smoke rising over Dhaka rooftops against the sun', 2024),
    dakghar,
    drawing('Red', 'Red.jpg', 'Red line drawing of a face beside a block of red hatching'),
    photo('July Student Protest', 'July Uprising/July Student Protest.jpg', 'A crowd of student protesters beneath a spreading tree', 2024, [
      [`${PH}/July Uprising/July Student Protest (2).JPG`, 'Protesters gathered under a tree, seen from behind'],
      [`${PH}/July Uprising/IMG_E4999.JPG`, 'Black-and-white crowd of protesters under a tree'],
    ]),
    ducs,
    drawing('Morning', 'Morning.png', 'Watercolour of peacocks and a squirrel in a forest clearing'),
    photo('Black and white', 'Black and white/IMG_E3934.JPG', 'A woman reading a book by a window at night', undefined, [
      [`${PH}/Black and white/IMG_E0098.JPG`, 'An old boatman with an oar on a misty river'],
      [`${PH}/Black and white/IMG_E3952.JPG`, 'Two women resting their heads together'],
      [`${PH}/Black and white/WhatsApp Image 2024-10-27 at 08.40.28_e975c6d9.jpg`, 'A woman walking across a misty field toward a lone tree'],
      [`${PH}/Black and white/IMG_8588.HEIC`, 'A hand holding old postcards of Kolkata, including the Birla Planetarium'],
    ]),
    {
      title: 'Padma River',
      category: 'photography',
      main: ['', ''],
      video: [`${PH}/Others/Padma River.MOV`, 'Video: two covered wooden boats on the still Padma river under a low sun', 1, 1080],
    },
    photo('Cox’s Bazar', "Others/Cox's Bazar.HEIC", 'A family standing on the crowded beach at Cox’s Bazar in evening light'),
    photo('Krishna on Starry Night', 'Others/Krishna on Starry Night.JPG', 'A masked Chhau performer in a Starry Night costume'),
    photo('Seize the Night', 'Others/Seize the Night.JPG', 'A candlelight vigil crowd at night'),
    photo('Post Uprising', 'Others/Post Uprising.JPG', 'Red-bereted guards marching past protest graffiti, seen from above'),
    photo('Cho Mask', 'Others/Cho Mask.JPG', 'A child wearing a large Chhau mask'),
    photo('Durga Puja Kolkata', 'Others/Durga Puja Kolkata.JPG', 'Crowds at a Durga Puja pandal gate in Kolkata'),
    photo('Maternal family', 'Others/Maternal family.jpg', 'An old framed family photograph, black and white'),
    photo('On the way of University Admission Exam', 'Others/On the way of University Admission Exam.JPG', 'A young man at a train window at dusk'),
    photo('Biday', 'Others/Biday.jpg', 'A figure seen through a narrow vertical gap'),
    photo('Self', 'Others/Self.jpg', 'A shadowy self-portrait behind a sheer curtain'),
    photo('Yellow', 'Others/Yellow.jpg', 'A girl roller-skating between cones'),
    photo('Untitled', 'Others/IMG_8457.JPG', 'People riding on the back of a truck under a blue evening sky'),
    photo('Untitled', 'Others/IMG_E9431.JPG', 'A striped parachute on a wet beach'),
  ]

  log(`Uploading ${list.length} works…`)
  for (const w of list) {
    let video: number | undefined
    let main: { id: number }
    if (w.video) {
      const v = await uploadVideo(...w.video)
      video = v.video.id
      main = w.main[0] ? await upload(...w.main) : v.poster
    } else main = await upload(...w.main)
    const more = []
    for (const m of w.more ?? []) more.push((await upload(...m)).id)
    await payload.create({
      collection: 'works',
      data: { title: w.title, category: w.category, year: w.year, description: w.description, image: main.id, moreImages: more, video },
    })
    log(`  ✓ ${w.title}`)
  }

  // ---------- blog: Dakghar essay ----------
  log('Creating blog post “Playing Amal”…')
  const essay = JSON.parse(fs.readFileSync(path.resolve('scripts/content/dakghar.json'), 'utf8')) as Seg[][]
  const cover = await upload(dakghar.main[0], 'Amal at the window in Dakghar')
  await payload.create({
    collection: 'posts',
    data: {
      title: 'Playing Amal: A Boy at the Window and Me',
      slug: 'playing-amal',
      excerpt:
        'It is a quiet play, but it says a lot about how a child can be shut inside four walls and still carry the whole world in his imagination.',
      cover: cover.id,
      publishedDate: '2026-11-11T00:00:00.000Z',
      content: richText(essay.slice(1)) as never,
      _status: 'published',
    },
  })

  // ---------- about + settings ----------
  log('Updating About page and contact settings…')
  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      kicker: 'Hello, I’m Joye!',
      title: 'About me',
      heroSubtitle: 'information science student · performing artist · digital rights activist',
      bio: [
        'I am a Master’s student in Information Science and Library Management at the University of Dhaka. I completed my bachelor’s degree in the same department. My research interests include critical digital literacy, data ethics, technology that supports marginalised communities, and community-led archiving and preservation of collective memory.',
        'I work as an audio-visual archivist at the Bangladesh Protest Archive, preserving community-generated protest videos and records of civic movements. I advocate for digital rights through my work with Activate Rights, focusing on safe and inclusive digital platforms for gender-diverse and marginalised communities with a feminist approach to technology. I am also serving as a NetMission.Asia Ambassador, engaging young people across the region through a capacity-building program on internet governance and digital policy.',
        'I am also a Kathak dance practitioner and theatre artist; I performed in the stage production “Narir July” at the Indomitable Women’s Award 2025. I also choreographed and directed “Dhoratol Nritto,” a production drawing from traditional mask dance and martial arts from greater Bengal, which was showcased at several dance festivals and cultural events. Art has shaped how I understand storytelling, culture and collective memory, and continues to influence the questions I bring to my research.',
        'Outside my work, I enjoy travelling, meeting people and learning how different communities express themselves through art, culture and everyday life; I love learning from people and the different ways they see and experience the world.',
        'I am always open to research collaborations, exchanging ideas and conversations about our shared interests. Feel free to reach out!',
      ].join('\n\n'),
    },
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { tagline: 'Information Science Student, Performing Artist, Digital Rights Activist' },
  })

  // ---------- research (from CV) ----------
  log('Creating research entries…')
  await payload.delete({ collection: 'research', where: { id: { exists: true } } })
  const research = [
    {
      title: 'Preserving Refugee Identity and Memory through Community Archives: Accessibility and Ethical Practice in the Rohingya Archive',
      kind: 'Master’s thesis',
      institution: 'University of Dhaka',
      period: 'In progress',
      status: 'current' as const,
      summary:
        'Supervisor: Rowshon Akter, University of Dhaka.\n\nAnalysing community-led blockchain archiving initiatives to examine ethical governance over data and accessibility to archives among displaced populations with limited digital literacy.',
    },
    {
      title: 'Safety Planning During Internet Shutdowns for People Experiencing Domestic Threats',
      kind: 'Research Field Resource Person',
      institution: 'Activate Rights',
      period: 'Mar 2026 – Apr 2026',
      status: 'completed' as const,
      summary:
        'Conducted qualitative interviews with representatives from vulnerable communities, such as persons with disabilities and LGBTQ+ individuals who are victims of domestic violence, to explore what digital tools they use to ensure their safety and how this was hampered during internet shutdowns, to design tools.\n\nContributed to interview transcription and qualitative data preparation for thematic analysis.',
    },
    {
      title: 'AI and Health Information Literacy among Women in South Asia',
      kind: 'Research Assistant',
      institution: 'University of Dhaka',
      period: 'Jul 2025 – Feb 2026',
      status: 'completed' as const,
      summary:
        'Supervisor: Dr. Md. Anwarul Islam, University of Dhaka.\n\nConducted three focus group discussions in a hybrid format and assisted in data collection; supported qualitative documentation and synthesis on women’s digital and health literacy readiness.',
    },
    {
      title: 'Exploring Critical Digital Literacy Competencies of University Library Professionals in Dhaka City',
      kind: 'Undergraduate monograph',
      institution: 'University of Dhaka',
      period: '2025',
      status: 'completed' as const,
      summary:
        'Supervisor: Dr. Md. Roknuzzaman.\n\nInvestigated critical digital literacy competencies and professional readiness around information integrity within evolving algorithmic systems across university libraries, through a cross-institutional quantitative study of public and private universities (structured questionnaires, analysed in SPSS) to identify key competency gaps.',
    },
    {
      title: 'Initiatives of Public Libraries of Bangladesh in Achieving Sustainable Development Goals: Current Status and Future Strategies',
      kind: 'Field Research Assistant',
      institution: 'University of Dhaka — University Grants Commission of Bangladesh (UGC)',
      period: 'Sep 2024 – Feb 2025',
      status: 'completed' as const,
      summary:
        'Investigators: Dr. Md. Roknuzzaman and Susmita Saha, University of Dhaka.\n\nCollected empirical data from 25+ public libraries across multiple districts in Bangladesh through online surveys and on-site visits, assessing SDG implementation challenges to inform future strategies.',
    },
    {
      title: 'Research interests',
      status: 'future' as const,
      summary:
        'Critical digital literacy, data ethics, technology that supports marginalised communities, and community-led archiving and preservation of collective memory.',
    },
  ]
  for (const r of research) await payload.create({ collection: 'research', data: r })

  // ---------- projects (from CV) ----------
  log('Creating projects…')
  await payload.delete({ collection: 'projects', where: { id: { exists: true } } })
  const projects = [
    {
      title: 'Bangladesh Protest Archive',
      role: 'Audio-Visual Archivist',
      period: 'Jan 2025 – present',
      summary:
        'Building a community-driven audiovisual database from the July 2024 mass uprising and protests to support truth, accountability and justice for abuses and state violence, aiding future justice processes.\n\nCoordinating workshops on metadata preservation and verification so that community-generated audiovisual materials can serve as credible documentation for investigations and transitional justice efforts.',
    },
    {
      title: 'Activate Rights',
      role: 'Creative Advocacy Coordinator',
      period: 'Dec 2024 – present',
      summary:
        'Coordinated the “Internet Freedom Campaigner Fellowship 2026”, empowering youth advocates through capacity-building, mentorship and civic engagement. Organised workshops and advocacy campaigns to strengthen youth and student activism and promote democratic participation in Bangladesh.\n\nCoordinated the development of a “Resource Hub” and a social media engagement strategy, and documented cases of technology-facilitated gender-based violence (TFGBV), including online threats and doxxing targeting young women, while supporting survivor-centred reporting and referral practices.',
    },
    {
      title: 'NetMission.Asia',
      role: 'Ambassador',
      period: 'Cohort 2025–2026',
      summary:
        'Explored digital rights and internet governance from a human-centred perspective, examining how policy, power and multi-stakeholder participation shape the digital ecosystem, and collaborated with peers across Asia on case studies of regional digital rights issues.\n\nCollaborated on the ICANN Model Conference Info Kit 2026 and volunteers with the NetMission.Asia Digital Content and Research Committee.',
    },
  ]
  for (const p of projects) await payload.create({ collection: 'projects', data: p })

  // ---------- trainings + certificates ----------
  log('Updating trainings and certificates…')
  const C = 'Tranings and Cirtificates'
  const existing = await payload.find({ collection: 'trainings', limit: 100 })
  const byTitle = (needle: string) => existing.docs.find((t) => t.title.toLowerCase().includes(needle))

  const fact = byTitle('alternative futures')
  if (fact)
    await payload.update({
      collection: 'trainings',
      id: fact.id,
      data: { certificate: (await upload(`${C}/Fact Checking.jpg`, 'Certificate of participation, Alternative Futures workshop (Goethe-Institut Bangladesh, 2024)')).id },
    })
  const cip = byTitle('code in place')
  if (cip)
    await payload.update({
      collection: 'trainings',
      id: cip.id,
      data: {
        certificate: (await upload(`${C}/Code in Place_Python.pdf`, 'Certificate of completion, Stanford Code in Place 2023')).id,
        link: 'https://codeinplace.stanford.edu/cip3/certificate/orswv1',
      },
    })

  const ml = byTitle('machine learning')
  if (ml)
    await payload.update({
      collection: 'trainings',
      id: ml.id,
      data: { certificate: (await upload(`${C}/certificate on Machine Leaning.jpg`, 'Certificate of training, Python with Machine Learning, Creative IT Institute 2023')).id },
    })

  const add = [
    {
      title: 'Training on Internet Governance and Digital Policies — NetMission Academy',
      organisation: 'NetMission.Asia',
      year: 2026,
      cert: [`${C}/Netmission Asia_ Training on Internet Governace and Digital Policies.png`, 'Certificate of completion, NetMission Academy 2026'] as [string, string],
    },
    {
      title: 'Foundations: Data, Data, Everywhere',
      organisation: 'Google, via Coursera',
      year: 2022,
      link: 'https://coursera.org/verify/GDFYKMTML4D2',
      cert: [`${C}/CERTIFICATE_Foundation on Data analytics.jpeg`, 'Google course certificate, Foundations: Data, Data, Everywhere'] as [string, string],
    },
    {
      title: 'Web Programming using PHP/MySQL',
      organisation: 'Institute of Information Technology, University of Dhaka',
      year: 2022,
      cert: [`${C}/IIT_PhP & MySQL.jpg`, 'Certificate, Web Programming using PHP/MySQL, IIT University of Dhaka 2022'] as [string, string],
      rotate: 90,
    },
  ]
  for (const t of add) {
    if (byTitle(t.title.toLowerCase().slice(0, 20))) continue
    const certificate = t.cert ? (await upload(t.cert[0], t.cert[1], { rotate: 'rotate' in t ? t.rotate : undefined })).id : undefined
    await payload.create({
      collection: 'trainings',
      data: { title: t.title, organisation: t.organisation, year: t.year, link: 'link' in t ? t.link : undefined, certificate },
    })
  }

  // ---------- conference photos ----------
  log('Adding conference photos…')
  const drapac25 = (await payload.find({ collection: 'talks', where: { event: { contains: 'DRAPAC) 2025' } }, limit: 1 })).docs[0]
  const ar = await upload('conference photo/IMG_3403.JPG', 'Activate Rights team at the Asia-Pacific Digital Rights Assembly 2025')
  if (drapac25) await payload.update({ collection: 'talks', id: drapac25.id, data: { photos: [ar.id] } })
  // Event not identifiable from these files: kept in the media library for Joye to attach to the right talk.
  await upload('conference photo/IMG_2980.JPG', 'Conference photo: Joye speaking in a panel session')
  await upload('conference photo/WhatsApp Image 2025-09-28 at 20.46.24_ef173485.jpg', 'Conference photo: group of participants, 28 September 2025')

  fs.rmSync(TMP, { recursive: true, force: true })
  log('Import complete ✔')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
