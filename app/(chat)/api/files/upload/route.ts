import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import sanitize from "sanitize-filename";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { generateUUID } from "@/lib/utils";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    const key = `chatbot/${session.user.id}/${generateUUID()}/${sanitize(filename)}`;

    try {
      await env.R2.put(key, fileBuffer);
      const data = await env.R2.head(key);
      if (!data || !data.httpMetadata?.contentType) {
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }

      return NextResponse.json({
        url: new URL(data.key, import.meta.env.VITE_IMAGE_URL).toString(),
        pathname: filename,
        contentType: data.httpMetadata.contentType,
      });
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export type UploadResult = {
  url: string;
  pathname: string;
  contentType: string;
};

export type UploadError = {
  error: string;
};
