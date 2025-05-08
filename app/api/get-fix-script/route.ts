import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // 讀取修復腳本
    const scriptPath = path.join(process.cwd(), "supabase/migrations/fix_database_structure.sql")
    const script = fs.readFileSync(scriptPath, "utf8")

    return NextResponse.json({ script })
  } catch (error) {
    console.error("Error reading fix script:", error)
    return NextResponse.json({ error: "Failed to read fix script" }, { status: 500 })
  }
}
