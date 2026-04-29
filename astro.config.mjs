// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://support.fledgepractice.com',
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
				// Custom footer with three columns + bottom copyright strip.
				Footer: './src/components/Footer.astro',
			},
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
				{
					label: 'Privacy & security',
					autogenerate: { directory: 'privacy-security' },
				},
			],
		}),
	],
});
