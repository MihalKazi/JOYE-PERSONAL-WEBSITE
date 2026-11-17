# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary owner/editor:** Iffat Nowshin Joye — non-technical; she edits all content herself through the Payload admin (`/admin`). Anything she must touch has to be form-simple: upload, type, pick, save.
- **Visitors (all confirmed as audiences):**
  - Grad-school admissions, fellowship and scholarship committees evaluating her as a researcher.
  - Digital-rights organisations, archives, employers and conference organisers looking for an archivist, trainer, speaker or panellist.
  - Arts and dance community — festivals, choreographers, galleries — interested in her performance, drawing and photography.
  - Peers, collaborators and the general public, including readers arriving via blog posts.

## Product Purpose

A personal portfolio for Joye: one place that presents her creative practice first and makes her research, archiving and advocacy record easy to verify (CV, talks, trainings). Success = a visitor from any of the audiences above leaves with a clear sense of who she is and a way to reach her or read her CV, and Joye can keep it current without help.

## Positioning

Joye sits where memory, technology and the body meet: an audio-visual archivist of the July 2024 uprising (Bangladesh Protest Archive), an information-science researcher on digital literacy and rights (University of Dhaka), and a Kathak dancer/choreographer working with Greater-Bengal forms (Chhau, Raibenshe, Lathi Khela). The site's distinctiveness is that combination, not any one strand.

## Operating Context

- Based in Dhaka, Bangladesh; audiences are both local and international (DRAPAC, NetMission.Asia, ASIS&T).
- Visitors often arrive from a CV, application, LinkedIn, or conference programme and need to scan fast; arts visitors come to look.
- Content lifecycle: Joye adds works, blog posts, talks and trainings over time; CV PDF is replaced as it changes.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router) + Payload CMS 3 in one app (`joye-site/`); SQLite locally. Production hosting, database and media storage are **undecided**.
- Content model: Research, Publications, Projects, Blog posts (draft/publish), News, Talks, Works (Creative practice: Performance / Drawings / Photography, drag-to-order), Trainings (with certificate upload), Media; globals "Name & contact" and "About page" (bio, portrait, per-page intro lines).
- Routes (one page per item in `../website.pdf`, shared tab nav + wave footer from the layout): `/` = About me (no tab row; a round "Explore the work" seal on the portrait frame grows into the landscape page), `/explore` = landscape hero (mist + contour lines + tabs), `/research`, `/publications`, `/projects`, `/blog`, `/blog/[slug]`, `/news`, `/talks`, `/creative-practice`, `/cv`, `/training`, `/contact`; `/about` redirects to `/`. Empty pages show "Coming soon."
- Admin-panel polish is deferred; the frontend comes first.
- Copy voice: **third person** ("Iffat Nowshin Joye is…").
- Emphasis: **creative work leads**; research/archiving is present but secondary (bio, talks, CV).

## Brand Commitments

- Name: **Iffat Nowshin Joye** (CV spelling "Joye").
- The three mockups in the repo root (`../1.png` about split, `../2.png` landscape hero with tab nav and contour lines, now at `/explore` (About is the landing page since 2026-11-17), `../3.png` dark gallery grid) are the binding design direction.
- Motion references the user made binding: jonathanzong.com (flowing noise lines), mnesselrodt.com (wave-line footer).
- Hand-drawn red scribble self-portrait (`seed-assets/portrait.jpg`) is her own mark.

## Evidence on Hand

- Real: CV PDF (`seed-assets/cv.pdf`) — education, research roles, talks (DRAPAC 2025/2026, Archive and Resist Conclave 2026), trainings, creative practice, references.
- Real: hero landscape photo and red self-portrait, both cropped from the mockups at low resolution — originals still needed.
- **Placeholder, must be replaced, never presented as hers:** the 8 gallery images (stock photos from the mockup), their titles, and the sample blog post.
- **Missing:** LinkedIn, GitHub and Bangladesh Protest Archive URLs; real performance/drawing/photo images; any press or testimonials (do not invent).

## Product Principles

1. **The work speaks first.** Creative output leads; interface recedes around it.
2. **Credible at a glance.** Research, talks and CV are one click away and factual — no inflated claims.
3. **She can run it alone.** Every content surface must be editable through simple admin forms; no feature that needs a developer to update.
4. **Memory as material.** Archival care — dates, places, attribution — is part of the voice.

## Accessibility & Inclusion

- Respect `prefers-reduced-motion` (all canvas/GSAP motion has a static fallback).
- Mobile-first audiences in Bangladesh: pages must work well on mid-range phones and slower connections.
