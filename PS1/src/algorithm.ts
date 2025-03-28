/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { finished } from "stream";
import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  // Find the highest bucket number to determine the array size
  const maxBucket = buckets.size > 0 ? Math.max(...buckets.keys()) : 0;
  
  // Initialize an array with empty Sets for all possible buckets
  const bucketArray: Array<Set<Flashcard>> = Array.from({ length: maxBucket + 1 }, () => new Set());

  // Fill the array with sets from the Map, ensuring empty buckets are included
  for (const [bucket, cards] of buckets.entries()) {
      bucketArray[bucket] = new Set(cards);
  }

  return bucketArray;
}


/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  // Initialize min and max buckets
  let minBucket: number | null = null;
  let maxBucket: number | null = null;
  // Find the first non-empty bucket
  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    if (bucket && bucket.size > 0) {
      minBucket = i;
      break;
    }
  }
  
  // If no non-empty buckets were found, return undefined
  if (minBucket === null) {
    return undefined;
  }
  
  // Find the last non-empty bucket
  for (let i = buckets.length - 1; i >= 0; i--) {
    const bucket = buckets[i];
    if (bucket && bucket.size > 0) {
      maxBucket = i;
      break;
    }
  }
  
  // At this point, minBucket is not null, so maxBucket cannot be null either
  return { minBucket, maxBucket: maxBucket! };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const practiceSet = new Set<Flashcard>();

  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i] && day % (2 ** i) === 0) {
      // Explicitly tell TypeScript that buckets[i] is not undefined
      for (const card of buckets[i]!) {
        practiceSet.add(card);
      }
    }
  }

  return practiceSet;
}


/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  const newBuckets = new Map(buckets);
  let currentBucket = -1;
  const bucketKeys = Array.from(newBuckets.keys());
  const maxBucket = bucketKeys.length > 0 ? Math.max(...bucketKeys) : 0;

  // Find the current bucket of the card
  for (const [bucketNum, cards] of newBuckets.entries()) {
    if (cards.has(card)) {
      currentBucket = bucketNum;
      cards.delete(card);
      break;
    }
  }

  if (currentBucket === -1) return newBuckets; // Card not found

  let newBucket = currentBucket;
  if (difficulty === AnswerDifficulty.Easy) {
    newBucket = Math.min(currentBucket + 1, maxBucket);
  } else if (difficulty === AnswerDifficulty.Hard) {
    newBucket = Math.max(currentBucket - 1, 0);
  }

  if (!newBuckets.has(newBucket)) {
    newBuckets.set(newBucket, new Set());
  }
  newBuckets.get(newBucket)!.add(card);

  return newBuckets;
}



// * Computes statistics about the user's learning progress.
// *
// * @param buckets representation of learning buckets.
// * @param history representation of user's answer history.
// * @returns statistics about learning progress.
// * @spec.requires [SPEC TO BE DEFINED]
export function getHint(card: Flashcard): string {
  if (!card || !card.front) {
    throw new Error("Invalid flashcard");
  }

  return card.front.substring(0, Math.max(1, Math.floor(card.front.length / 3))) + "...";
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns statistics about learning progress.
 * @spec.requires [SPEC TO BE DEFINED]
 */
export function computeProgress(
  buckets: Map<number, Set<Flashcard>>,
  history: Array<{ card: Flashcard; difficulty: AnswerDifficulty }>
): { totalCards: number; averageBucket: number; recentPerformance: number } {
  let totalCards = 0;
  let bucketSum = 0;
  
  for (const [bucketNum, cards] of buckets.entries()) {
    totalCards += cards.size;
    bucketSum += bucketNum * cards.size;
  }
  
  const averageBucket = totalCards > 0 ? bucketSum / totalCards : 0;

  const recentAttempts = history.slice(-10);
  const recentPerformance =
    recentAttempts.length > 0
    ? recentAttempts.filter((attempt) => attempt.difficulty === AnswerDifficulty.Easy).length /
    recentAttempts.length
  : 0;


  return { totalCards, averageBucket, recentPerformance };
}
