import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateSchoolID } from "@/lib/generateSchoolID";

export async function POST(req: Request) {
  const client = await pool.connect(); // get client for transaction
  try {
    await client.query("BEGIN"); // start transaction

    const body = await req.json();
    const { section } = body; // e.g. "A" or "B"

    function sanitize<T>(value: T): T | null {
      return value === "" ? null : value;
    }

    if (section === "A") {
      const {
        tin,
        officialName,
        yearEstablished,
        cacNumber,
        proprietorName,
        chairmanName,
        licenseNumber,
        lastLicenseRenewal,
        ownershipType,
        lastTaxFiling,
        state,
        lga,
        address,
        email,
        phone,
        website,
      } = body;

      const existing = await client.query(
        `SELECT * FROM schoolskano WHERE tin = $1`,
        [tin]
      );

      if (existing.rows.length > 0) {
        const result = await client.query(
          `
          UPDATE schoolskano
          SET 
            name = COALESCE($2, name),
            year_established = COALESCE($3, year_established),
            cac_number = COALESCE($4, cac_number),
            proprietor_name = COALESCE($5, proprietor_name),
            chairman_name = COALESCE($6, chairman_name),
            license_number = COALESCE($7, license_number),
            last_license_renewal = COALESCE($8, last_license_renewal),
            ownership = COALESCE($9, ownership),
            last_tax_filing = COALESCE($10, last_tax_filing),
            state = COALESCE($11, state),
            lga = COALESCE($12, lga),
            address = COALESCE($13, address),
            email = COALESCE($14, email),
            phone = COALESCE($15, phone),
            website = COALESCE($16, website)
          WHERE tin = $1
          `,
          [
            tin,
            sanitize(officialName),
            sanitize(yearEstablished),
            sanitize(cacNumber),
            sanitize(proprietorName),
            sanitize(chairmanName),
            sanitize(licenseNumber),
            sanitize(lastLicenseRenewal),
            sanitize(ownershipType),
            sanitize(lastTaxFiling),
            sanitize(state),
            sanitize(lga),
            sanitize(address),
            sanitize(email),
            sanitize(phone),
            sanitize(website),
          ]
        );

        console.log(`✅ Section A updated rows: ${result.rowCount}`);
      } else {
        const school_id = await generateSchoolID(officialName);
        await client.query(
          `
          INSERT INTO schoolskano (
            tin,
            school_id,
            name,
            year_established,
            cac_number,
            proprietor_name,
            chairman_name,
            license_number,
            last_license_renewal,
            ownership,
            last_tax_filing,
            state,
            lga,
            address,
            email,
            phone,
            website
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          `,
          [
            tin,
            sanitize(school_id),
            sanitize(officialName),
            sanitize(yearEstablished),
            sanitize(cacNumber),
            sanitize(proprietorName),
            sanitize(chairmanName),
            sanitize(licenseNumber),
            sanitize(lastLicenseRenewal),
            sanitize(ownershipType),
            sanitize(lastTaxFiling),
            sanitize(state),
            sanitize(lga),
            sanitize(address),
            sanitize(email),
            sanitize(phone),
            sanitize(website),
          ]
        );
        console.log(`✅ Section A inserted new record for TIN: ${tin}`);
      }
    }

    // ✅ Handle Section B updates with transaction and existence check
    else if (section === "B") {
      const {
        tin,
        faculties,
        modeOfOperation,
        studentPopulation,
        intlStudents,
        populationByLevel,
        avgFee,
        totalRevenue,
        avgFeeByLevel,
        academicSession,
        weeksPerSemester,
        sessionStart,
        sessionEnd,
        programmes,
      } = body;

      const existing = await client.query(
        `SELECT tin FROM schoolskano WHERE tin = $1`,
        [tin]
      );

      if (existing.rows.length === 0) {
        console.warn(
          `⚠️ No record found for TIN ${tin} during Section B update.`
        );
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "No record found for this TIN" },
          { status: 400 }
        );
      }

      try {
        console.log("TIN received for update:", tin);

        const result = await client.query(
          `
          UPDATE schoolskano
          SET 
            faculties = COALESCE($2, faculties),
            mode_of_operation = COALESCE($3, mode_of_operation),
            student_population = COALESCE($4, student_population),
            intl_students = COALESCE($5, intl_students),
            population_by_level = COALESCE($6, population_by_level),
            avg_fee = COALESCE($7, avg_fee),
            total_revenue = COALESCE($8, total_revenue),
            avg_fee_by_level = COALESCE($9, avg_fee_by_level),
            academic_session = COALESCE($10, academic_session),
            weeks_per_semester = COALESCE($11, weeks_per_semester),
            session_start = COALESCE($12, session_start),
            session_end = COALESCE($13, session_end),
            programmes = COALESCE($14, programmes)
          WHERE tin = $1
          `,
          [
            tin,
            sanitize(faculties),
            JSON.stringify(modeOfOperation),
            sanitize(studentPopulation),
            sanitize(intlStudents),
            JSON.stringify(populationByLevel),
            sanitize(avgFee),
            sanitize(totalRevenue),
            JSON.stringify(avgFeeByLevel),
            sanitize(academicSession),
            sanitize(weeksPerSemester),
            sanitize(sessionStart),
            sanitize(sessionEnd),
            JSON.stringify(programmes),
          ]
        );

        console.log(`✅ Section B updated rows: ${result.rowCount}`);
        if (result.rowCount === 0) {
          console.warn(`⚠️ Section B: No rows affected for TIN ${tin}`);
        }
      } catch (dbError) {
        console.error("❌ Database error during Section B update:", dbError);
        throw dbError;
      }
    }

    // ✅ Handle Section C updates with transaction and existence check
    else if (section === "C") {
      const {
        tin,
        methodOfCollection,
        paymentGateway,
        currentGateway,
        partnerBanks,
        paymentReports,
      } = body;

      const existing = await client.query(
        `SELECT tin FROM schoolskano WHERE tin = $1`,
        [tin]
      );

      if (existing.rows.length === 0) {
        console.warn(
          `⚠️ No record found for TIN ${tin} during Section C update.`
        );
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "No record found for this TIN" },
          { status: 400 }
        );
      }

      try {
        console.log("TIN received for update:", tin);

        const result = await client.query(
          `
          UPDATE schoolskano
          SET 
            method_of_collection = COALESCE($2, method_of_collection),
            payment_gateway = COALESCE($3, payment_gateway),
            current_gateway = COALESCE($4, current_gateway),
            partner_banks = COALESCE($5, partner_banks),
            payment_reports = COALESCE($6, payment_reports)
            
          WHERE tin = $1
          `,
          [
            tin,
            JSON.stringify(methodOfCollection),
            sanitize(paymentGateway),
            sanitize(currentGateway),
            sanitize(partnerBanks),
            sanitize(paymentReports),
          ]
        );

        console.log(`✅ Section C updated rows: ${result.rowCount}`);
        if (result.rowCount === 0) {
          console.warn(`⚠️ Section C: No rows affected for TIN ${tin}`);
        }
      } catch (dbError) {
        console.error("❌ Database error during Section C update:", dbError);
        throw dbError;
      }
    }

    // ✅ Handle Section D updates with transaction and existence check
    else if (section === "D") {
      const {
        tin,
        licenceStatus,
        prevLicence,
        prevAmount,
        prevDate,
        outstandingPenalties,
        penalty,
      } = body;

      const existing = await client.query(
        `SELECT tin FROM schoolskano WHERE tin = $1`,
        [tin]
      );

      if (existing.rows.length === 0) {
        console.warn(
          `⚠️ No record found for TIN ${tin} during Section C update.`
        );
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "No record found for this TIN" },
          { status: 400 }
        );
      }

      try {
        console.log("TIN received for update:", tin);

        const result = await client.query(
          `
          UPDATE schoolskano
          SET 
            licence_status = COALESCE($2, licence_status),
            prev_licence = COALESCE($3, prev_licence),
            prev_amount = COALESCE($4, prev_amount),
            prev_licence_date = COALESCE($5, prev_licence_date),
            outstanding_penalties = COALESCE($6, outstanding_penalties),
            penalty = COALESCE($7, penalty)
            
          WHERE tin = $1
          `,
          [
            tin,
            sanitize(licenceStatus),
            sanitize(prevLicence),
            sanitize(prevAmount),
            sanitize(prevDate),
            sanitize(outstandingPenalties),
            sanitize(penalty),
          ]
        );

        console.log(`✅ Section D updated rows: ${result.rowCount}`);
        if (result.rowCount === 0) {
          console.warn(`⚠️ Section D: No rows affected for TIN ${tin}`);
        }
      } catch (dbError) {
        console.error("❌ Database error during Section D update:", dbError);
        throw dbError;
      }
    }

    // ✅ Handle Section E updates with transaction and existence check
    else if (section === "E") {
      const { tin, eName, comments } = body;

      const existing = await client.query(
        `SELECT tin FROM schoolskano WHERE tin = $1`,
        [tin]
      );

      if (existing.rows.length === 0) {
        console.warn(
          `⚠️ No record found for TIN ${tin} during Section C update.`
        );
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "No record found for this TIN" },
          { status: 400 }
        );
      }

      try {
        console.log("TIN received for update:", tin);

        const result = await client.query(
          `
          UPDATE schoolskano
          SET 
            enumerator_name = COALESCE($2, enumerator_name),
            enumerator_comments = COALESCE($3, enumerator_comments)
           
          WHERE tin = $1
          `,
          [tin, sanitize(eName), sanitize(comments)]
        );

        console.log(`✅ Section  updated rows: ${result.rowCount}`);
        if (result.rowCount === 0) {
          console.warn(`⚠️ Section E: No rows affected for TIN ${tin}`);
        }
      } catch (dbError) {
        console.error("❌ Database error during Section E update:", dbError);
        throw dbError;
      }
    }

    await client.query("COMMIT"); // commit transaction if successful
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK"); // undo all changes if anything fails
    console.error("❌ Transaction failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save section" },
      { status: 500 }
    );
  } finally {
    client.release(); // release client back to pool
  }
}
