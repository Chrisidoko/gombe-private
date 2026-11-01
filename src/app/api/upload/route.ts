// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";
import pool from "@/lib/db";
import path from "path";
import { requireSchoolAccess } from "@/lib/apiAuth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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

    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Upload a PDF, JPG or PNG under 10MB." },
        { status: 400 }
      );
    }

    // Open to registering schools with no login yet, so only for a school that
    // exists; an approved school can only be changed by its own account.
    const schoolRes = await pool.query(
      "SELECT approval_status FROM schoolskano WHERE school_id = $1",
      [school_id]
    );
    if (schoolRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "School not found." },
        { status: 404 }
      );
    }
    if (schoolRes.rows[0].approval_status === "approved") {
      const denied = await requireSchoolAccess(school_id);
      if (denied) return denied;
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
