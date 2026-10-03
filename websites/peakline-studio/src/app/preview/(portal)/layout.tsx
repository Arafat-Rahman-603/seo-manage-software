import Link from 'next/link';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Project Portal</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link href="/preview" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Dashboard
          </Link>
          <Link href="/preview/editor" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Visual Editor
          </Link>
          <Link href="/preview/seo" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            SEO Management
          </Link>
          <Link href="/preview/deployments" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Deployments
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
