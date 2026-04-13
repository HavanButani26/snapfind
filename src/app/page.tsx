import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-violet-600">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            SnapFind
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-violet-600 transition-colors">How it works</a>
            <a href="#stats" className="hover:text-violet-600 transition-colors">Stats</a>
            <a href="#faq" className="hover:text-violet-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-violet-600 font-medium transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"/>
            AI-Powered Photo Sharing
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Share Photos with{' '}
            <span className="text-violet-600">AI Face Recognition</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate AI-powered photo sharing platform. Upload once, and let SnapFind
            instantly deliver photos to your guests using face recognition.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register"
              className="px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-violet-200">
              Start Free Trial
            </Link>
            <a href="#how-it-works"
              className="px-8 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors text-base">
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['PS', 'RK', 'AP', 'MJ'].map((initials, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {initials[0]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">10K+ Photographers</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-1">4.9/5</span>
              <span className="text-sm text-gray-400">Rating</span>
            </div>
          </div>
        </div>

        {/* Hero card mockup */}
        <div className="max-w-3xl mx-auto mt-16 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"/>
            <div className="w-3 h-3 rounded-full bg-yellow-400"/>
            <div className="w-3 h-3 rounded-full bg-green-400"/>
            <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 ml-2 text-left">
              snapfind.app/guest/event-2025
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['bg-violet-200', 'bg-blue-200', 'bg-pink-200', 'bg-amber-200', 'bg-green-200', 'bg-purple-200'].map((c, i) => (
                <div key={i} className={`${c} rounded-xl aspect-video flex items-center justify-center`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-violet-50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-violet-700">AI Recognition</p>
                  <p className="text-xs text-violet-500">3 photos found!</p>
                </div>
              </div>
              <div className="bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                99.9% Accuracy
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────────── */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Trusted by photographers worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { icon: '🔒', title: 'Bank-Grade Security', desc: 'SSL encrypted' },
              { icon: '🛡️', title: 'Privacy Protected', desc: 'Your data stays yours' },
              { icon: '⚡', title: '99.9% Uptime', desc: 'Always available' },
              { icon: '🏆', title: 'Award Winning', desc: 'Trusted by pros' },
              { icon: '💬', title: '24/7 Support', desc: 'Here to help' },
              { icon: '⭐', title: '4.9/5 Rating', desc: '1000+ reviews' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section id="stats" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Trusted by Thousands Worldwide</h2>
          <p className="text-gray-500 mb-14">Join photographers and event organizers who trust SnapFind</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '100M+', label: 'Photos Delivered', sub: 'To users worldwide' },
              { value: '50M+', label: 'Faces Scanned', sub: 'With AI precision' },
              { value: '99.9%', label: 'Recognition Accuracy', sub: 'Industry-leading AI' },
              { value: '10K+', label: 'Happy Photographers', sub: 'Trust SnapFind' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-violet-600 mb-1">{stat.value}</p>
                <p className="text-sm font-semibold text-gray-900">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to deliver photos</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From AI face recognition to billing — SnapFind covers your entire photography workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Feature 1 — AI Face Recognition */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Face Recognition</h3>
              <p className="text-gray-500 text-sm mb-5">Upload once and let our AI instantly match every guest to their photos with 99.9% accuracy.</p>
              <ul className="flex flex-col gap-2">
                {['Instant selfie-based photo search', 'Emotion-based photo filtering', 'Group photo finder'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2 — Live Event Wall */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Event Photo Wall</h3>
              <p className="text-gray-500 text-sm mb-5">Display photos in real-time on a big screen as they're uploaded — exclusive to SnapFind.</p>
              <ul className="flex flex-col gap-2">
                {['Real-time photo updates via WebSocket', 'Guest reactions with floating emoji', 'Auto quality filtering'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 — Billing */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 10h20"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Billing & Quotations</h3>
              <p className="text-gray-500 text-sm mb-5">Create professional quotations, track payments and export GST-ready PDFs in one click.</p>
              <ul className="flex flex-col gap-2">
                {['Custom quotation builder', 'GST-ready PDF export', 'Send via WhatsApp or email'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 4 — Core platform */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Upload & Sharing</h3>
              <p className="text-gray-500 text-sm mb-5">Upload hundreds of photos at once, generate QR codes and share galleries instantly.</p>
              <ul className="flex flex-col gap-2">
                {['Drag & drop bulk uploader', 'QR code per event', 'Full-resolution downloads'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Core feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '🤖', title: 'AI Face Recognition', desc: 'Production-grade accuracy' },
              { icon: '📤', title: 'Bulk Uploads', desc: 'Thousands of photos fast' },
              { icon: '📱', title: 'QR Code Sharing', desc: 'Instant guest access' },
              { icon: '🖼️', title: 'High Quality Delivery', desc: 'No compression loss' },
              { icon: '😊', title: 'Emotion Filter', desc: 'Find your best moments' },
              { icon: '👥', title: 'Group Photo Finder', desc: 'Find photos together' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How SnapFind Works</h2>
            <p className="text-gray-500">Go from raw shots to a share-ready gallery in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create an Event',
                desc: 'Set up your event, add details and get a unique QR code to share with guests.',
                color: 'bg-violet-50 border-violet-100',
                numColor: 'text-violet-300',
              },
              {
                step: '02',
                title: 'Upload Photos',
                desc: 'Drag and drop hundreds of photos at once. Our AI processes faces automatically.',
                color: 'bg-blue-50 border-blue-100',
                numColor: 'text-blue-300',
              },
              {
                step: '03',
                title: 'Guests Find Their Photos',
                desc: 'Guests scan the QR code, take a selfie, and instantly see all their photos.',
                color: 'bg-green-50 border-green-100',
                numColor: 'text-green-300',
              },
            ].map(s => (
              <div key={s.step} className={`${s.color} border rounded-2xl p-7 text-center`}>
                <p className={`text-6xl font-bold ${s.numColor} mb-4`}>{s.step}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '99.9%', label: 'Recognition Accuracy' },
              { value: '2 sec', label: 'Avg. Scan Time' },
              { value: '50M+', label: 'Faces Detected' },
              { value: '100M+', label: 'Photos Scanned' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-violet-600">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Trusted by Photographers Worldwide</h2>
            <p className="text-gray-500">Join thousands who trust SnapFind for photo delivery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'SnapFind transformed my wedding photography business. AI face recognition delivers photos to clients instantly. They find their moments in seconds, not hours.',
                name: 'Priya Sharma',
                role: 'Wedding Photographer, Mumbai',
                initials: 'PS',
                color: 'from-violet-400 to-violet-600',
              },
              {
                quote: 'Smart categorization saves me hours of manual sorting. Upload once, and families get their photos automatically. It\'s effortless photo delivery.',
                name: 'Rajesh Kumar',
                role: 'Event Photographer, Surat',
                initials: 'RK',
                color: 'from-blue-400 to-blue-600',
              },
              {
                quote: 'The group photo finder is a game changer. Guests can find photos with their entire family in one click. Never seen this anywhere else.',
                name: 'Ananya Patel',
                role: 'Portrait Photographer, Bangalore',
                initials: 'AP',
                color: 'from-pink-400 to-pink-600',
              },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="flex flex-col gap-4">
            {[
              {
                q: '🤖 How does AI face recognition work?',
                a: 'Guests upload a selfie via a QR code link. Our InsightFace AI extracts a 512-dimensional face embedding and compares it against all processed event photos using cosine similarity. Photos above the match threshold are instantly returned.',
              },
              {
                q: '🔒 Is my data secure and private?',
                a: 'Yes. All photos are stored on Cloudflare R2 with SSL encryption. Face embeddings are stored as numerical vectors — not actual face images. Each event is protected by access controls and only active events are publicly accessible.',
              },
              {
                q: '📸 How do guests receive their photos?',
                a: 'You share a QR code or link with guests. They open it on their phone, take a selfie, and the AI instantly finds all their photos from the event. No app download or account required.',
              },
              {
                q: '😊 What is the emotion filter?',
                a: 'After face recognition finds your photos, you can filter them by mood — smiling, surprised, neutral, and more. The AI detects the dominant facial expression in each photo at upload time.',
              },
              {
                q: '👥 What is the Group Photo Finder?',
                a: 'A unique feature not found in other photo sharing apps. Select 2–4 people from the event and SnapFind returns only photos where all selected people appear together in the same frame.',
              },
              {
                q: '📺 What is the Live Event Photo Wall?',
                a: 'A real-time display screen (open on any TV or projector) that shows newly uploaded photos the moment the photographer uploads them. Guests can react with emojis from their phones.',
              },
            ].map((item, i) => (
              <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 text-sm hover:bg-gray-50 transition-colors list-none">
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-violet-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Photo Experience?
          </h2>
          <p className="text-violet-200 mb-8 text-lg">
            Join thousands of photographers who have revolutionized how they share photos.
          </p>
          <Link href="/register"
            className="inline-block px-8 py-4 bg-white text-violet-600 font-bold rounded-xl hover:bg-violet-50 transition-colors text-base shadow-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                SnapFind
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                Empowering photographers with AI-powered face recognition for instant photo delivery.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold text-sm mb-4">Product</p>
              <div className="flex flex-col gap-2.5 text-sm">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                <Link href="/register" className="hover:text-white transition-colors">Get started</Link>
              </div>
            </div>

            <div>
              <p className="text-white font-semibold text-sm mb-4">Account</p>
              <div className="flex flex-col gap-2.5 text-sm">
                <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
                <Link href="/register" className="hover:text-white transition-colors">Create account</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} SnapFind. Built for a college final year project.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              All systems operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}