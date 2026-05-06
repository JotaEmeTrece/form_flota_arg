type UploadResult = {
  secure_url: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

export async function uploadDocumentToCloudinary(
  file: File,
  opts: { candidateName: string; field: string }
): Promise<string> {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const folder = process.env.CLOUDINARY_FOLDER || "form_flota_argentina";

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const publicIdBase = `${opts.candidateName || "candidato"}_${opts.field}_${Date.now()}`.replace(/[^\w-]/g, "_");

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  body.append("public_id", publicIdBase);
  body.append("use_filename", "false");
  body.append("unique_filename", "false");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body,
  });

  const data = (await res.json()) as Partial<UploadResult> & { error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || "No se pudo subir el archivo a Cloudinary.");
  }
  return data.secure_url;
}
