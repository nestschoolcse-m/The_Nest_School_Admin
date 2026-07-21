"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Users, UserPlus, FileText, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: UserPlus, label: "Modify Student", href: "/modify-student" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Info, label: "About", href: "/about" },
]

export function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const pathname = usePathname()

  const handleLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
          isCollapsed ? "md:w-16" : "md:w-64",
          isMobileOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("flex items-center justify-center h-20 border-b border-gray-100 transition-all", isCollapsed ? "md:px-2" : "p-4")}>
            <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
              <Image
                src="/logo.png"
                alt="The Nest School"
                width={isCollapsed ? 40 : 120}
                height={isCollapsed ? 40 : 50}
                className={cn("object-contain transition-all", isCollapsed ? "md:w-10" : "md:w-[120px]", isMobileOpen && "w-[120px]")}
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-2 overflow-y-auto transition-all", isCollapsed ? "md:p-2" : "p-4")}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center rounded-xl transition-all px-3 py-3 gap-3",
                    isCollapsed && "md:justify-center md:p-3 md:gap-0",
                    isActive 
                      ? "bg-nest-50 text-nest-700 shadow-sm ring-1 ring-nest-200/50" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                    isCollapsed ? "md:opacity-0 md:w-0" : "md:opacity-100 md:w-auto",
                    isMobileOpen && "opacity-100 w-auto"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Collapse Button - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center p-4 border-t border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  )
}
