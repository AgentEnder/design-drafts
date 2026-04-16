export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900 text-gray-100 font-[Inter,sans-serif] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
      <header className="relative border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
            D
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Design Drafts</h1>
            <p className="text-xs text-gray-500">Preview branch deployments</p>
          </div>
        </div>
      </header>
      <main className="relative max-w-5xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
