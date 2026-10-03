/** Resolve an internal route or public asset against the deployment base. */
export function withBase(route: string, base = import.meta.env.BASE_URL): string {
  if (!route.startsWith("/") || route.startsWith("//")) {
    throw new Error("An internal path must begin with one slash.");
  }
  return `${base.replace(/\/$/, "")}${route}`;
}

/** Resolve owner-maintained specimen attributes while preserving external URLs and anchors. */
export function withBaseAttributes(html: string, base = import.meta.env.BASE_URL): string {
  return html.replaceAll(
    /(?:src|href)=(['"])(\/(?!\/)[^'"]*)\1/g,
    (attribute: string, _quote: string, route: string) => attribute.replace(route, withBase(route, base)),
  );
}
