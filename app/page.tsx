import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import { Course } from '@/types'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: featuredCourses } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(id, full_name),
      lessons(id)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8)

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Learn Without Limits
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-2xl mx-auto">
            Unlock your potential with expert-led courses in programming, design, business, and more.
            Start learning today — free and paid courses available.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-lg"
            >
              Browse Courses
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 border border-indigo-400 transition-colors text-lg"
            >
              Start Teaching →
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { label: 'Courses', value: courseCount ?? 0 },
              { label: 'Students', value: studentCount ?? 0 },
              { label: 'Payout', value: '80%' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-indigo-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Why LearnHub?</h2>
            <p className="mt-3 text-gray-500 text-lg">Everything you need to learn and grow</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🎓', title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience.' },
              { icon: '🚀', title: 'Learn at Your Pace', desc: 'Lifetime access to course content. Learn anytime, anywhere.' },
              { icon: '💰', title: 'Affordable Pricing', desc: 'Free courses available. Paid courses priced for everyone.' },
              { icon: '📜', title: 'Certificates', desc: 'Earn certificates of completion to showcase your skills.' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Access your courses from any device, anytime.' },
              { icon: '🤝', title: 'Become an Instructor', desc: 'Share your knowledge and earn 80% of every course sale.' },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
                <p className="mt-2 text-gray-500">Handpicked by our team</p>
              </div>
              <Link href="/courses" className="text-indigo-600 font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course as unknown as Course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instructor CTA */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Turn Your Expertise Into Income</h2>
          <p className="mt-4 text-indigo-100 text-lg">
            Join thousands of instructors earning passive income by sharing their knowledge.
            You keep <strong>80%</strong> of every sale — we handle the rest.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-lg"
          >
            Start Teaching Today →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl font-bold text-white mb-2">LearnHub</p>
          <p className="text-sm">The platform that puts learning first.</p>
          <div className="mt-6 flex justify-center gap-8 text-sm">
            <Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link>
            <Link href="/register" className="hover:text-white transition-colors">Become an Instructor</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="mt-8 text-xs text-gray-600">
            © {new Date().getFullYear()} LearnHub. Built with Next.js &amp; Supabase.
          </p>
        </div>
      </footer>
    </div>
  )
}
