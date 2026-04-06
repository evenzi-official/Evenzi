import { listProjects } from '@/lib/amc/db/queries'

export default async function AmcOverviewPage() {
  let projects: Awaited<ReturnType<typeof listProjects>> = []
  let error: string | null = null

  try {
    projects = await listProjects()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load projects'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mission Control</h1>
        <p className="text-gray-400 mt-1">Agent pipeline orchestration &amp; monitoring</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Active Runs" value={0} />
        <StatCard label="Agents" value={0} />
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Recent Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No projects yet.{' '}
            <a href="/amc/projects" className="text-blue-400 hover:underline">
              Register your first project →
            </a>
          </p>
        ) : (
          <ul className="space-y-2">
            {projects.map(p => (
              <li key={p.id}>
                <a
                  href={`/amc/projects/${p.id}`}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  <span className="text-gray-500 text-xs">{p.repo_url ?? 'No repo'}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
