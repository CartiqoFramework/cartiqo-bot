import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getVersion = (workspaceName: string): string => {
	const baseDir = ['core', 'dashboard', 'shared'].includes(workspaceName) ? 'packages' : 'bots';
	const filePath = path.resolve(__dirname, `../../../${baseDir}/${workspaceName}/VERSION`);
	if (!fs.existsSync(filePath)) return 'unknown';
	return fs.readFileSync(filePath, 'utf-8').trim();
};

export const getAllVersions = (): Record<string, string> => {
	const workspaces = ['core', 'dashboard', 'shared', 'client', 'helper'];
	const versions: Record<string, string> = {};
	for (const ws of workspaces) {
		versions[ws] = getVersion(ws);
	}
	return versions;
};
