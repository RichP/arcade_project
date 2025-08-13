export interface GenreMapping {
  id: string; // e.g., gm-0001
  name: string; // canonical category name
  includes: string[]; // raw genre strings to collapse into name
  emoji?: string; // optional emoji to represent this canonical genre
}
