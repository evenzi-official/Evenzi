import { renderHelpMarkdown } from '@/lib/help/markdown'

export async function HelpArticle({ answer }: { answer: string }) {
  const html = await renderHelpMarkdown(answer)
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
