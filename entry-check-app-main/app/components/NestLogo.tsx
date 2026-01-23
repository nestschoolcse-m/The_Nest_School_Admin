"use client"
import React from "react"
import Link from "next/link"

export default function NestLogo({ size = 48 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-purple-600 text-white font-bold"
      >
        NS
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold">NestSchool</div>
        <div className="text-xs text-gray-500">Entry Check</div>
      </div>
    </Link>
  )
}
