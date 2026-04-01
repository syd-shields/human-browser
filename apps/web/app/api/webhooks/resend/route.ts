import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

/** Inbound address to handle; route other recipients with 200 + skip to avoid retries. */
const UPLOAD_INBOX = process.env.RESEND_UPLOAD_INBOX;

type EmailReceivedEvent = {
  type: string;
  data?: {
    email_id?: string;
    created_at?: string;
    from?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message_id?: string;
  };
};

function normalizeAddress(raw: string): string {
  const trimmed = raw.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  const addr = (angle?.[1] ?? trimmed).trim().toLowerCase();
  return addr;
}

function isValidRecipient(
  addresses: string[] | undefined,
  recipient: string,
): boolean {
  if (!addresses?.length) return false;
  const want = recipient.toLowerCase();
  return addresses.some((entry) => normalizeAddress(entry) === want);
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[api/webhooks/resend] Webhook signing secret not configured");
    return new NextResponse("Webhook signing secret not configured", {
      status: 503,
    });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[api/webhooks/resend] Missing webhook verification headers");
    return new NextResponse("Missing webhook verification headers", {
      status: 400,
    });
  }

  const payload = await request.text();

  let event: EmailReceivedEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as EmailReceivedEvent;
  } catch {
    console.error("[api/webhooks/resend] Invalid webhook signature");
    return new NextResponse("Invalid webhook signature", { status: 400 });
  }

  if (event.type !== "email.received") {
    console.info("[api/webhooks/resend] Unhandled webhook event: ", event.type);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const to = event.data?.to;
  if (!isValidRecipient(to, UPLOAD_INBOX)) {
    console.info("[api/webhooks/resend] Could not find recipient in inbox for upload@humanbrowser.com. Recipient: ", to);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "recipient_not_upload_inbox",
    });
  }

  console.info("[api/webhooks/resend] Found recipient in inbox for upload@humanbrowser.com. Recipient: ", to);
  // Metadata only in the webhook; fetch body/attachments via Received Email API:
  // https://resend.com/docs/api-reference/emails/retrieve-received-email
  return NextResponse.json({
    ok: true,
    email_id: event.data?.email_id,
    subject: event.data?.subject,
    from: event.data?.from,
  });
}
