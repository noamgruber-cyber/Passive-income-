export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="h-3 flex-1 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
