import { notFound } from 'next/navigation'
import { getProject, listAgents } from '@/lib/amc/db/queries'

interface Props {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: Props) {
  const [project, agents] = await Promise.all([
    getProject(params.id).catch(() => null),
    listAgents(params.id).catch(() => []),
  ])

  if (!project) notFound()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        {project.description && (
          <p className="text-gray-400 mt-1">{project.description}</p>
        )}
        {project.repo_url && (
          <a
            href={project.repo_url}
            className="text-blue-400 text-sm mt-2 inline-block hover:underline font-mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.repo_url} ↗
          </a>
        )}
      </div>

      {/* Webhook / CLI setup info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium mb-3">CLI Setup</h2>
        <p className="text-gray-400 text-sm mb-3">
          Add this to your project&apos;s{' '}
          <code className="bg-gray-700 px-1.5 py-0.5 rounded">.amc-config.json</code>:
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-400 overflow-x-auto">
{JSON.stringify(
  {
    amcUrl: 'https://your-app.vercel.app',
    projectId: project.id,
    webhookSecret: '(run amc-cli init to generate)',
    agentsDir: 'ai/agents',
    autoReport: true,
  },
  null,
  2
)}
        </pre>
      </div>

      {/* Agents list */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Agents ({agents.length})</h2>
          <a
            href={`/amc/agents?project_id=${project.id}`}
            className="text-blue-400 text-sm hover:underline"
          >
            Manage →
          </a>
        </div>
        {agents.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No agents yet. Run{' '}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded">npx amc-cli push-agents</code>{' '}
            to sync.
          </p>
        ) : (
          <ul className="space-y-2">
            {agents.map(agent => (
              <li key={agent.id} className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">{agent.name}</span>
                  <span className="text-gray-500 text-xs ml-2">({agent.role})</span>
                </div>
                <span className="text-gray-500 text-xs font-mono">
                  {agent.provider}:{agent.model_id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
