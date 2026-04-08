import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const BACKEND_API_KEY = process.env.MEDUSA_BACKEND_API_KEY ?? ""
const ESCALATION_EMAIL = process.env.ESCALATION_FROM_EMAIL ?? "noreply@sharif.no"

export async function POST(req: NextRequest) {
  const { email, message } = await req.json()

  if (!message) {
    return NextResponse.json({ ok: false, error: "message required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${BACKEND}/admin/sharif-escalations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BACKEND_API_KEY}`,
      },
      body: JSON.stringify({
        customer_email: email ?? null,
        message,
        status: "pending",
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "backend error" }, { status: 500 })
    }

    // Email notification would be triggered here in production
    // Requires an email provider configured in the Medusa backend
    void ESCALATION_EMAIL

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
