import { writeFile, mkdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const STORAGE_DIR = process.env.STORAGE_DIR || join(process.cwd(), "storage");
const RESUMES_DIR = join(STORAGE_DIR, "resumes");

// Ensure storage directories exist
export async function ensureStorageDirs() {
    if (!existsSync(STORAGE_DIR)) {
        await mkdir(STORAGE_DIR, { recursive: true });
    }
    if (!existsSync(RESUMES_DIR)) {
        await mkdir(RESUMES_DIR, { recursive: true });
    }
}

// Generate a unique filename for uploaded files
export function generateFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop() || "pdf";
    return `${userId}-${timestamp}-${random}.${extension}`;
}

// Save a file to storage
export async function saveFile(
    userId: string,
    file: File
): Promise<{ fileName: string; filePath: string; publicUrl: string }> {
    await ensureStorageDirs();

    const fileName = generateFileName(userId, file.name);
    const filePath = join(RESUMES_DIR, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    const publicUrl = `/api/storage/resumes/${fileName}`;

    return {
        fileName,
        filePath,
        publicUrl,
    };
}

// Read a file from storage
export async function readFileFromStorage(
    fileName: string
): Promise<Buffer> {
    const filePath = join(RESUMES_DIR, fileName);

    if (!existsSync(filePath)) {
        throw new Error("File not found");
    }

    return await readFile(filePath);
}

// Check if a file exists
export async function fileExists(fileName: string): Promise<boolean> {
    const filePath = join(RESUMES_DIR, fileName);
    try {
        await stat(filePath);
        return true;
    } catch {
        return false;
    }
}

// Extract filename from URL
export function getFileNameFromUrl(url: string): string | null {
    const match = url.match(/\/api\/storage\/resumes\/(.+)$/);
    return match ? match[1] : null;
}
