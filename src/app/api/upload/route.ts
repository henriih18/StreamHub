import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { toast } from "sonner";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha subido ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de archivo no válido. Solo se permiten JPEG, PNG, SVG y WebP.",
        },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Archivo demasiado grande. El tamaño máximo es de 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear directorio uploads si no existe
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directorio ya existe
    }

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    // Determinar extensión y procesamiento basado en el tipo de archivo
    let filename, fileBuffer;
    if (file.type === "image/svg+xml") {
      filename = `${timestamp}_${randomString}.svg`;
      fileBuffer = buffer; // SVG no se convierte, se guarda como está
    } else {
      filename = `${timestamp}_${randomString}.webp`;
      // Convertir a WebP y optimizar
      fileBuffer = await sharp(buffer)
        .webp({
          quality: 85,
          effort: 4,
        })
        .resize({
          width: 512,
          height: 512,
          fit: "cover",
          position: "center",
        })
        .toBuffer();
    }

    const filepath = join(uploadsDir, filename);

    // Guardar archivo
    await writeFile(filepath, fileBuffer);

    // Devolver URL del archivo
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: filename,
    });
  } catch (error) {
    //console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: "Error al cargar el archivo" },
      { status: 500 }
    );
  }
}
