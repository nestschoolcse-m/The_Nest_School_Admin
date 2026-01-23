import { FileText, ExternalLink } from "lucide-react"

export default function ReportsPage() {
  const rawUrl = process.env.NEXT_PUBLIC_SENTRY_PROJECT_URL || process.env.SENTRY_PROJECT_URL || "";

  const cleaned = rawUrl ? rawUrl.replace(/^\"(.*)\"$/, "$1").trim() : "";

  const SENTRY_URL = cleaned
    ? /^https?:\/\//i.test(cleaned)
      ? cleaned
      : `https://${cleaned.replace(/^\/+/, "")}`
    : "https://sentry.io/organizations/nest-school/projects/javascript-nextjs/";
  
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Reports</h2>
        <p className="text-gray-500 mb-6">
          Open Sentry website for viewing analytics.
        </p>
        
        {/* Sentry Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href={SENTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            <FileText className="w-5 h-5" />
            View Crash Reports in Sentry
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}