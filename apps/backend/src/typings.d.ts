declare module 'stopword' {
  /**
   * Removes stopwords from an array of strings.
   * @param words - The array of words to filter.
   * @param stops - An array of strings containing the stopwords to be removed.
   */
  export function removeStopwords(words: string[], stops?: string[]): string[];

  // Language arrays
  export const eng: string[];
  export const deu: string[];
  export const fra: string[];
  export const spa: string[];
}
