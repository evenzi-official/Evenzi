import Link from 'next/link'
import { listProjects } from '@/lib/amc/db/queries'

export default async function ProjectsPage() {
  const projects = await listProjects().catch(() => [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">Repositories connected to AMC</p>
        </div>
        <Link
          href="/amc/projects/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Register Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No projects registered yet.</p>
          <p className="text-sm mt-2">
            Run <code className="bg-gray-800 px-2 py-0.5 rounded">npx amc-cli init</code> in
            your project to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/amc/projects/${project.id}`}
              className="block bg-gray-800/50 border border-gray-700 hover:border-gray-500 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                  )}
                  {project.repo_url && (
                    <p className="text-blue-400 text-xs mt-2 font-mono">{project.repo_url}</p>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
