import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Supabase is configured with real storage bucket
    if (isSupabaseConfigured) {
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("email-assets")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("email-assets")
          .getPublicUrl(filePath);

        return NextResponse.json({
          success: true,
          url: publicUrlData.publicUrl,
          filename: fileName,
        });
      }
    }

    // Fallback: Convert to base64 Data URL for instant, zero-setup email preview rendering
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      success: true,
      url: base64Image,
      filename: file.name,
      isDemoFallback: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
