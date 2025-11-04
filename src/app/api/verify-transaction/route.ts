import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const amount = searchParams.get("amount");

    if (!ref || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters (ref, amount)" },
        { status: 400 }
      );
    }

    const merchantCode = "MX146867"; // replace with your live merchant code
    const url = `https://webpay.interswitchng.com/collections/api/v1/gettransaction.json?merchantcode=${merchantCode}&transactionreference=${ref}&amount=${amount}`;

    console.log("🔍 Checking transaction:", { ref, amount, url });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Gateway responded with ${response.status}`);
    }

    const data = await response.json();

    // Log the raw response for debugging
    console.log("🧾 Interswitch Response:", data);

    // Extract response details
    const responseCode = data?.ResponseCode;
    let status = "failed";

    // Interpret response code
    switch (responseCode) {
      case "00":
      case "10":
      case "11":
        status = "success";
        break;
      case "09":
        status = "pending";
        break;
      case "Z6":
        status = "cancelled";
        break;
      case "06":
        status = "error";
        break;
      default:
        status = "failed";
        break;
    }

    console.log("✅ Transaction Status:", status);

    // Return structured response
    return NextResponse.json({
      success: true,
      status,
      message: data?.ResponseDescription || "Unknown status",
      raw: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Transaction verification error:", message);
    return NextResponse.json(
      {
        success: false,
        message: "Transaction verification failed",
        details: message,
      },
      { status: 500 }
    );
  }
}
