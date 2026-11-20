import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArrowLeftIcon } from '@/components/icons'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getClient } from '@/lib/payload'
import { tidyLinks } from '@/lib/richtext'

type Params = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost((await params).slug)
  return post ? { title: post.title, description: post.excerpt ?? undefined } : {}
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const cover = asMedia(post.cover)
  const coverUrl = mediaUrl(cover, 'large')

  return (
    <main className="page page--narrow">
      <article className="post">
        <Link href="/#blog" className="post__back mono">
          <ArrowLeftIcon /> All posts
        </Link>
        <h1 className="post__title">{post.title}</h1>
        <time className="mono post__date">
          {new Date(post.publishedDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        {coverUrl && cover && (
          <div className="post__cover">
            <Image
              src={coverUrl}
              alt={cover.alt || ''}
              width={cover.width ?? 1600}
              height={cover.height ?? 900}
              sizes="(max-width:800px) 100vw, 750px"
              style={{ objectPosition: focalPosition(cover) }}
            />
          </div>
        )}
        <div className="post__body">
          <RichText data={tidyLinks(post.content)} />
        </div>
        <div className="post__end" aria-hidden="true" />
      </article>
    </main>
  )
}
