import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export function resolveFontPath(): string {
  const candidates: string[] = [];

  const appPath = app.getAppPath();
  candidates.push(path.join(appPath, 'assets', 'fonts', 'NotoSans-Regular.ttf'));

  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'assets', 'fonts', 'NotoSans-Regular.ttf')
    );
  }

  candidates.push(path.join(__dirname, '..', 'assets', 'fonts', 'NotoSans-Regular.ttf'));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const message = `NotoSans-Regular.ttf font not found. Looked in: ${candidates.join(
    ' , '
  )}. Ensure assets/fonts/NotoSans-Regular.ttf is bundled with the app.`;
  throw new Error(message);
}

