import adapter from '@sveltejs/adapter-node';

const base = process.env.BASE_PATH ?? '/blog';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		paths: {
			base
		},
		inlineStyleThreshold: 2048
	}
};

export default config;
