import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	schema: 'schema.prisma',
	migrations: {
		path: './migrations',
		seed: 'tsx prisma/cartiqo/seed.ts',
	},
	datasource: {
		url: env('DATABASE_URL_CARTIQO'),
	},
});
