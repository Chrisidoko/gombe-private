// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";
import pool from "@/lib/db";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const school_id = formData.get("school_id") as string;

    if (!file || !type || !school_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🧩 Clean filename (remove extension)
    const baseName = path.parse(file.name).name; // "certificate" instead of "certificate.pdf"
    const timestamp = Date.now();
    const publicId = `${timestamp}_${baseName}`;

    // 🧩 Upload to Cloudinary under a per-school folder
    const uploadResponse = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `school_documents/${school_id}`,
            public_id: publicId,
            resource_type: "auto", // handles image, pdf, etc.
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
        stream.end(buffer);
      }
    );

    // 🧩 Save metadata in PostgreSQL
    const insertQuery = `
      INSERT INTO schoolkano_documents (school_id, document_type, file_url, public_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [
      school_id,
      type,
      uploadResponse.secure_url,
      uploadResponse.public_id,
    ];

    await pool.query(insertQuery, values);

    return NextResponse.json(
      {
        success: true,
        message: "Document uploaded successfully.",
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Upload failed:", message);
    return NextResponse.json(
      { success: false, error: message || "Upload failed." },
      { status: 500 }
    );
  }
}
