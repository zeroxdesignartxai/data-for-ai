import { z } from "zod";

export const releaseMetadataSchema = z.object({
  primaryArtist: z.string().min(1),
  trackTitle: z.string().min(1),
  releaseTitle: z.string().min(1),
  genre: z.string().min(1),
  language: z.string().min(1),
  explicit: z.boolean(),
  releaseDate: z.string().optional()
});

export type ReleaseMetadata = z.infer<typeof releaseMetadataSchema>;
