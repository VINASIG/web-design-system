import type { APIRoute } from 'astro';
import { withBase } from '../lib/paths';

const routes = ['/', '/agents/', '/brand/', '/foundations/', '/components/', '/patterns/', '/elements/'];

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('The public site origin is required.');
  const entries = routes.flatMap(route => [route, '/vi' + route]).map((route) => {
    const url = new URL(withBase(route), site).href.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `<url><loc>${url}</loc></url>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
