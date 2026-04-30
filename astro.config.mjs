// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://support.fledgepractice.com',
	// Pin unique ports so this repo can run alongside the other Fledge repos
	// (dashboard SPA 3200 / preview 3201 / lambda 4000, marketing 3002,
	// notes 3100). Astro's default 4321 is fine in isolation but conflicts
	// the moment two of these are open at once. Preview port is set via
	// the `--port` flag in package.json (Astro 6 has no `preview.port`
	// field in the user-config type).
	server: { port: 3300, host: 'localhost' },
	integrations: [
		starlight({
			title: 'Fledge Support',
			description:
				'Help and how-tos for Fledge Practice — the practice-management tool for speech-language pathologists.',
			favicon: '/favicon.svg',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Fledge',
				replacesTitle: false,
			},
			customCss: ['./src/styles/custom.css'],
			components: {
				// Flat single-line footer (copyright + a few links).
				Footer: './src/components/Footer.astro',
				// Page title with a Home › Category › Article breadcrumb above it.
				PageTitle: './src/components/PageTitle.astro',
			},
			// Right-hand "On this page" rail on by default. The route middleware
			// at ./src/routeData.ts then suppresses it when the page has fewer
			// than 2 ToC entries (i.e. the ToC would only contain the implicit
			// "Overview" link and no real H2/H3 anchors), so short articles
			// stay rail-free without per-article frontmatter.
			tableOfContents: true,
			routeMiddleware: ['./src/routeData.ts'],
			social: [
				{
					icon: 'external',
					label: 'Fledge app',
					href: 'https://app.fledgepractice.com',
				},
			],
			sidebar: [
				{
					label: 'Getting started',
					autogenerate: { directory: 'getting-started' },
				},
				{
					label: 'Clients',
					autogenerate: { directory: 'clients' },
				},
				{
					label: 'Sessions & notes',
					autogenerate: { directory: 'sessions-notes' },
				},
				{
					label: 'Invoices & payments',
					autogenerate: { directory: 'invoices-payments' },
				},
				{
					label: 'Account & billing',
					autogenerate: { directory: 'account-billing' },
				},
			],
		}),
	],
});
