import { Resend } from "resend";

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

function fromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "no-reply@rkiza.sa";
}

export async function sendOtpEmail(input: {
  to: string;
  code: string;
  locale: "en" | "ar";
  purpose: "register" | "login";
}) {
  const isAr = input.locale === "ar";
  const subject = isAr
    ? input.purpose === "register"
      ? "رمز التحقق — إنشاء حساب نقد"
      : "رمز تسجيل الدخول — نقد"
    : input.purpose === "register"
      ? "Your naqd verification code"
      : "Your naqd sign-in code";

  const heading = isAr ? "رمز التحقق الخاص بك" : "Your verification code";
  const body =
    input.purpose === "register"
      ? isAr
        ? "استخدم هذا الرمز لإكمال إنشاء حسابك في نقد."
        : "Use this code to complete your naqd account setup."
      : isAr
        ? "استخدم هذا الرمز لتسجيل الدخول إلى نقد."
        : "Use this code to sign in to naqd.";
  const footer = isAr
    ? "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة."
    : "If you didn't request this code, you can ignore this email.";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px">${heading}</h1>
      <p style="color:#555;margin:0 0 24px">${body}</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 24px;background:#f4f4f5;border-radius:12px;text-align:center">${input.code}</div>
      <p style="color:#888;font-size:13px;margin:24px 0 0">${footer}</p>
    </div>
  `;

  await client().emails.send({
    from: fromEmail(),
    to: input.to,
    subject,
    html,
    text: `${heading}\n\n${input.code}\n\n${footer}`,
  });
}
