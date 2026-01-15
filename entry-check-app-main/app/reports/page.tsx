import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Reports</h2>
        <p className="text-gray-500">Reports functionality will be available after backend integration.</p>
      </div>
    </div>
  )
}
