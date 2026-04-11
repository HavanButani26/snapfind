import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
          AI-Powered Photo Sharing
        </div>

        <h1 className="text-5xl font-semibold text-gray-900 leading-tight mb-4">
          Find your photos with{' '}
          <span className="text-violet-600">your face</span>
        </h1>

        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          Upload a selfie. Our AI scans thousands of event photos and delivers
          only yours — instantly. No scrolling. No searching.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Face Recognition', desc: 'InsightFace AI model' },
            { label: 'Emotion Filter', desc: 'Find your best expressions' },
            { label: 'Live Photo Wall', desc: 'Real-time event display' },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-sm font-medium text-gray-900">{f.label}</div>
              <div className="text-xs text-gray-400 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}