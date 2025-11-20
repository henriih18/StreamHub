import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { stat } from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = join(process.cwd(), "public", "uploads");

    try {
      const files = await readdir(uploadsDir);

      // Filter for image files and get their stats
      const imageFiles = await Promise.all(
        files
          .filter((file) => {
            const ext = file.split(".").pop()?.toLowerCase();
            return ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(
              ext || ""
            );
          })
          .map(async (file) => {
            try {
              const filePath = join(uploadsDir, file);
              const stats = await stat(filePath);

              return {
                filename: file,
                url: `/uploads/${file}`,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                modifiedAt: stats.mtime.toISOString(),
              };
            } catch (error) {
              console.error(`Error reading file stats for ${file}:`, error);
              return null;
            }
          })
      );

      // Filter out null results and sort by creation date (newest first)
      const validFiles = imageFiles
        .filter((file) => file !== null)
        .sort(
          (a, b) =>
            new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
        );

      return NextResponse.json({
        success: true,
        images: validFiles,
        total: validFiles.length,
      });
    } catch (dirError) {
      console.error("Error reading uploads directory:", dirError);
      return NextResponse.json({
        success: true,
        images: [],
        total: 0,
        message: "No uploads directory found",
      });
    }
  } catch (error) {
    console.error("Error fetching uploaded images:", error);
    return NextResponse.json(
      { error: "Error al cargar las imágenes subidas" },
      { status: 500 }
    );
  }
}
