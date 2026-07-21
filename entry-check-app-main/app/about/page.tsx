import { Settings, Users, Code, Palette, Cpu, Linkedin } from "lucide-react"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Lakshwin Krishna Reddy M",
      role: "Lead Architect & Backend Engineer",
      linkedin: "https://www.linkedin.com/in/lakshwinkrishna/",
    },
    {
      name: "Pradosh Gopalakrishnan",
      role: "Backend Engineer & Pentester",
      linkedin: "https://www.linkedin.com/in/pradosh-gopalakrishnan-a56a052a1/",
    },
    {
      name: "Dev Joshi",
      role: "Cloud Security Architect",
      linkedin: "https://www.linkedin.com/in/devjoshi2005/",
    },
    {
      name: "Bharathwaj",
      role: "Frontend Engineer",
      linkedin: "https://www.linkedin.com/in/bharathwaj-k-2111a3305/",
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 border border-gray-100 shadow-sm">
            <Users className="w-10 h-10 text-gray-700" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Developed By
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Meenakshi Sundararajan Engineering College
            CSE-2023-2027
          </p>
        </div>

        {/* Team Members in Single Column */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start space-x-5">
                {/* Icon Container */}


                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg align-center justify-center font-semibold text-gray-900">
                      {member.name}
                    </h3>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#0A66C2] transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>

                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {member.role}
                  </p>


                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Divider */}

      </div>
    </div>
  )
}