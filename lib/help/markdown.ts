import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import type { Root, RootContent } from 'mdast'

/**
 * Explicit allow-list. Everything not named here is stripped.
 * See spec section 8.1 for the full vector list this covers.
 */
const schema = {
  ...defaultSchema,
  tagNames: [
    'p', 'br', 'strong', 'em', 'del', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote', 'hr',
    'h3', 'h4', 'a',
  ],
  attributes: {
    a: ['href', 'title'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
  clobberPrefix: 'help-',
}

/**
 * With allowDangerousHtml: false, remark-rehype drops html nodes wholesale.
 * CommonMark can fold trailing text into the same html block
 * (e.g. `<script>…</script>hello`), so extract safe text first.
 */
function htmlToSafeText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}

function remarkPreserveHtmlText() {
  return (tree: Root): void => {
    const walk = (nodes: RootContent[]): void => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.type === 'html') {
          const text = htmlToSafeText(node.value)
          if (text) {
            nodes[i] = {
              type: 'paragraph',
              children: [{ type: 'text', value: text }],
            }
          } else {
            nodes.splice(i, 1)
            i -= 1
          }
          continue
        }
        if ('children' in node && Array.isArray(node.children)) {
          walk(node.children as RootContent[])
        }
      }
    }
    walk(tree.children)
  }
}

export async function renderHelpMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkPreserveHtmlText)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}
