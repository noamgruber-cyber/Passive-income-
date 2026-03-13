import Link from 'next/link'
import Image from 'next/image'
import { Course } from '@/types'
import { formatPrice } from '@/lib/utils'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-video bg-gray-100">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
              <span className="text-4xl">📚</span>
            </div>
          )}
          {course.price === 0 && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              FREE
            </span>
          )}
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            {course.category}
          </span>
          <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
          {course.instructor && (
            <p className="mt-1 text-xs text-gray-500">
              by {course.instructor.full_name || 'Instructor'}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="font-bold text-gray-900">
              {formatPrice(course.price)}
            </span>
            {course.lessons && (
              <span className="text-xs text-gray-500">
                {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
