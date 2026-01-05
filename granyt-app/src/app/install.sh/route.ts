import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getGranytMode } from '@/lib/utils';

export async function GET() {
  const mode = getGranytMode();
  if (mode !== 'DOCS' && mode !== 'DEV') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'scripts', 'install.sh');
    const fileContent = await fs.readFile(filePath, 'utf8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/x-shellscript',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none';",
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving install.sh:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
