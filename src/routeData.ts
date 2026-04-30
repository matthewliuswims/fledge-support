import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	// Starlight always prepends an "Overview" entry pointing at the page
	// title, so `items.length === 1` means "no real H2/H3 anchors to
	// navigate to." Suppress the right-hand rail in that case — a lone
	// Overview entry reads as visual clutter, not navigation. Rule of
	// thumb the user gave: only show the ToC when there are 2+ things
	// to go to (Overview + at least one heading).
	if (route.toc && route.toc.items.length < 2) {
		route.toc = undefined;
	}
});
