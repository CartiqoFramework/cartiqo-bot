import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import mime from 'mime-types';
import { logger } from './logger.js';

export function startTranscriptServer() {
	const app = express();
	const transcriptDir = path.join(process.cwd(), 'transcripts');
	console.log(transcriptDir);

	if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);

	app.get('/transcripts/:filename', (req, res) => {
		const { filename } = req.params;
		const filePath = path.join(transcriptDir, filename);

		if (!fs.existsSync(filePath)) {
			return res.status(404).send('Transcript not found.');
		}

		const contentType = mime.lookup(filePath) || 'text/html';
		res.setHeader('Content-Type', contentType);
		fs.createReadStream(filePath).pipe(res);
	});

	app.listen(process.env.TRANSCRIPT_PORT, () => {
		logger.info(`[TranscriptServer] Running at http://${process.env.TRANSCRIPT_DOMAIN}:${process.env.TRANSCRIPT_PORT}/transcripts/:id`);
	});
}
