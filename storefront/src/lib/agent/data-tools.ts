const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"

export async function executeDataTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "searchProducts": {
      const { dimension } = input as { dimension: string }
      // Parse dimension format: 205/55R16
      const match = dimension.match(/^(\d+)[/\\](\d+)[Rr](\d+)$/)
      if (!match) return { error: "Ugyldig dimensjon. Bruk format: 205/55R16" }
      const [, width, profile, rim] = match
      const url = `${BACKEND}/store/tires?width=${width}&profile=${profile}&rim=${rim}&region_id=reg_01JJQ5Y5TDCPD7KFCM7H0X4B8P`
      const res = await fetch(url, { cache: "no-store" })
      return res.json()
    }

    case "getProductDetail": {
      const { productId } = input as { productId: string }
      const res = await fetch(`${BACKEND}/store/products/${productId}?fields=*variants,*images,metadata`, {
        cache: "no-store",
      })
      return res.json()
    }

    case "lookupOrder": {
      const { email } = input as { email: string; otcToken: string }
      const res = await fetch(`${BACKEND}/store/orders?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      })
      return res.json()
    }

    case "sendOneTimeCode": {
      // Medusa v2 auth — send OTP via email
      const { email } = input as { email: string }
      const res = await fetch(`${BACKEND}/auth/customer/emailpass/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      return res.json()
    }

    case "verifyOneTimeCode": {
      const { email, code } = input as { email: string; code: string }
      const res = await fetch(`${BACKEND}/auth/customer/emailpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: code }),
      })
      return res.json()
    }

    case "escalateToAdmin": {
      // Handled by /api/agent/escalate — not called here directly
      return { ok: false, error: "escalateToAdmin must be handled by the escalate endpoint" }
    }

    default:
      return { error: `Unknown data tool: ${toolName}` }
  }
}
