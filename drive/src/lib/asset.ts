/** Public asset URL under the Vite base (/drive/ in production, / in dev). */
export const asset = (p: string): string => import.meta.env.BASE_URL + p.replace(/^\//, '');
