import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type Node = { type?: string; text?: string; children?: Node[]; [k: string]: unknown }

const isLink = (n: Node) => n.type === 'link' || n.type === 'autolink'
const space = (text: string, from: Node): Node => ({ ...from, type: 'text', text, format: 0, style: '' })

/**
 * Text pasted into the editor often carries the space before a link inside the link
 * ("read the <a> catalogue</a>"), so the underline starts on a blank. Move leading and trailing
 * spaces of a link's text outside the link. Returns a copy; the stored document is untouched.
 */
export function tidyLinks<T extends SerializedEditorState>(data: T): T {
  const walk = (node: Node): Node => {
    if (!Array.isArray(node.children)) return node
    const out: Node[] = []
    for (const raw of node.children) {
      const child = walk(raw)
      const kids = child.children
      if (!isLink(child) || !kids?.length) {
        out.push(child)
        continue
      }
      const first = kids[0]
      const last = kids[kids.length - 1]
      const lead = typeof first.text === 'string' ? (first.text.match(/^\s+/)?.[0] ?? '') : ''
      const trail = typeof last.text === 'string' ? (last.text.match(/\s+$/)?.[0] ?? '') : ''
      if (!lead && !trail) {
        out.push(child)
        continue
      }
      const trimmed = kids.map((k, i) => {
        if (typeof k.text !== 'string') return k
        let text = k.text
        if (i === 0) text = text.replace(/^\s+/, '')
        if (i === kids.length - 1) text = text.replace(/\s+$/, '')
        return { ...k, text }
      })
      if (lead) out.push(space(lead, first))
      out.push({ ...child, children: trimmed })
      if (trail) out.push(space(trail, last))
    }
    return { ...node, children: out }
  }
  return { ...data, root: walk(data.root as unknown as Node) } as T
}
