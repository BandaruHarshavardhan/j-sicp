import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase credentials missing.")
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    const files = formData.getAll("file") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No files received." }, { status: 400 })
    }

    const uploadedUrls = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const originalExtension = file.name.split('.').pop()
      const uniqueFilename = `${crypto.randomUUID()}.${originalExtension}`
      
      const { data, error } = await supabase.storage
        .from('jscip-uploads')
        .upload(uniqueFilename, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (error) {
        console.error("Supabase upload error:", error)
        throw error
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('jscip-uploads')
        .getPublicUrl(uniqueFilename)
        
      uploadedUrls.push(publicUrlData.publicUrl)
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Upload failed" }, { status: 500 })
  }
}
