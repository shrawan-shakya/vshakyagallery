import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qeqv70yn';
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const SANITY_API_VERSION = '2026-02-06';

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true, // Edge CDN cache for blazing fast visitor response
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source) {
  return builder.image(source);
}
