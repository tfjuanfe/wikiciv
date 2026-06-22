import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { canContributeNow, VERIFY_EMAIL_MESSAGE } from "@/lib/permissions";
import { rateLimit, retryMessage } from "@/lib/ratelimit";
import { putObject, storageConfigured } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

// POST /api/upload — multipart form with a single `file` image. Authenticated,
// email-verified contributors only. Returns { url } of the stored object.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Log in to upload." }, 401);
  if (!canContributeNow(user)) return json({ error: VERIFY_EMAIL_MESSAGE }, 403);
  if (!storageConfigured())
    return json({ error: "Uploads aren't configured yet." }, 503);

  const rl = await rateLimit(`upload:${user.id}`, 30, 600);
  if (!rl.ok) return json({ error: retryMessage(rl.retryAfter) }, 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Expected a multipart form upload." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "No file provided." }, 400);

  const ext = ALLOWED[file.type];
  if (!ext)
    return json(
      { error: "Only PNG, JPEG, WebP, or GIF images are allowed." },
      415,
    );
  if (file.size === 0) return json({ error: "The file is empty." }, 400);
  if (file.size > MAX_BYTES)
    return json({ error: "Image is too large (5 MB max)." }, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = `uploads/${user.id}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

  try {
    const url = await putObject(key, bytes, file.type);
    return json({ url }, 200);
  } catch (err) {
    console.error("[upload] R2 put failed:", err);
    return json({ error: "Upload failed. Please try again." }, 502);
  }
}
