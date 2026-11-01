// Downloads a school's Single Demand Notice as a PDF.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { getSchoolNotices } from "@/lib/annualNotices";
import { createNoticePdf } from "@/lib/noticePdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const noticeId = parseInt(id, 10);
  if (isNaN(noticeId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT n.school_id, n.year, n.notice_number, n.issued_at, n.due_date,
              s.name, s.address
       FROM annual_notices n
       LEFT JOIN schoolskano s ON s.school_id = n.school_id
       WHERE n.id = $1 AND n.status = 'issued'`,
      [noticeId],
    );
    const notice = rows[0];
    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    const denied = await requireSchoolAccess(notice.school_id);
    if (denied) return denied;

    const lines = (await getSchoolNotices(notice.school_id)).filter(
      (l) =>
        l.notice_id === noticeId ||
        (l.year < notice.year && l.status === "unpaid"),
    );

    const pdf = await createNoticePdf({
      schoolName: notice.name,
      address: notice.address,
      year: notice.year,
      noticeNumber: notice.notice_number,
      issuedAt: notice.issued_at,
      dueDate: notice.due_date,
      lines,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Demand-Notice-${notice.year}-${noticeId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Notice PDF failed:", error);
    return NextResponse.json({ error: "Failed to generate notice" }, { status: 500 });
  }
}
