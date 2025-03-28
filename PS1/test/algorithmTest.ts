import assert from "assert";
import { AnswerDifficulty, Flashcard, BucketMap } from "../src/flashcards";
import {
  toBucketSets,
  getBucketRange,
  practice,
  update,
  getHint,
  computeProgress,
} from "../src/algorithm";


/*
 * Testing strategy for toBucketSets():
 *
 * TODO: Describe your testing strategy for toBucketSets() here.
 */
function createFlashcard(front: string, back: string, hint: string = '', tags: string[] = []): Flashcard {
  return new Flashcard(front, back, hint, tags);
}

describe("toBucketSets()", () => {
  it("converts empty bucket map to empty array", () => {
    const emptyBuckets: BucketMap = new Map();
    const result = toBucketSets(emptyBuckets);
    assert.deepStrictEqual(result, []);
  });

  it("converts non-contiguous bucket map correctly", () => {
    const card1 = createFlashcard("Q1", "A1");
    const card2 = createFlashcard("Q2", "A2");
    const buckets: BucketMap = new Map([
      [0, new Set([card1])],
      [2, new Set([card2])],
    ]);

    const result = toBucketSets(buckets);
    assert.strictEqual(result.length, 3); // Should have 3 buckets (index 0, 1, 2)
    assert.ok(result[0]?.has(card1)); // Ensure card1 is in the 0th bucket
    assert.ok(result[2]?.has(card2)); // Ensure card2 is in the 2nd bucket
    assert.strictEqual(result[1]?.size, 0); // Ensure bucket 1 is empty
  });
});


/*
 * Testing strategy for getBucketRange():
 *
 * TODO: Describe your testing strategy for getBucketRange() here.
 */
describe("getBucketRange()", () => {
  it("returns undefined for empty buckets", () => {
    const emptyBuckets: Array<Set<Flashcard>> = [];
    assert.strictEqual(getBucketRange(emptyBuckets), undefined);
  });

  it("finds correct bucket range", () => {
    const card1 = createFlashcard("Q1", "A1");
    const card2 = createFlashcard("Q2", "A2");
    const buckets: Array<Set<Flashcard>> = [
      new Set(),
      new Set([card1]),
      new Set(),
      new Set([card2]),
    ];

    const range = getBucketRange(buckets);
    assert.deepStrictEqual(range, { minBucket: 1, maxBucket: 3 });
  });
});


/*
 * Testing strategy for practice():
 *
 * TODO: Describe your testing strategy for practice() here.
 */
describe("practice()", () => {
  it("practices bucket 0 cards every day", () => {
    const card1 = createFlashcard("Q1", "A1");
    const card2 = createFlashcard("Q2", "A2");
    const buckets: Array<Set<Flashcard>> = [
      new Set([card1, card2]),
      new Set(),
      new Set(),
    ];

    const practiceCards = practice(buckets, 5);
    assert.deepStrictEqual(practiceCards, new Set([card1, card2]));
  });

  it("practices higher bucket cards on specific days", () => {
    const card1 = createFlashcard("WOW", "WOOW");
    const card2 = createFlashcard("WOAH", "WOAAH");
    const buckets: Array<Set<Flashcard>> = [
      new Set(),
      new Set([card1]),
      new Set([card2]),
    ];

    const practiceCards1 = practice(buckets, 2);
    assert.deepStrictEqual(practiceCards1, new Set([card1]));

    const practiceCards2 = practice(buckets, 4);
    assert.deepStrictEqual(practiceCards2, new Set([card2]));
  });
});


/*
 * Testing strategy for update():
 *
 * TODO: Describe your testing strategy for update() here.
 */
describe("update()", () => {
  it("moves card to correct bucket based on difficulty", () => {
    const card = createFlashcard("Q1", "A1");
    const initialBuckets: BucketMap = new Map([
      [0, new Set([card])],
    ]);

    // Easy difficulty moves card up two buckets
    const easyUpdate = update(initialBuckets, card, AnswerDifficulty.Easy);
    assert.strictEqual(easyUpdate.get(2)?.has(card), true);

    // Hard difficulty moves card down one bucket
    const hardUpdate = update(initialBuckets, card, AnswerDifficulty.Hard);
    assert.strictEqual(hardUpdate.get(1)?.has(card), true);

    // Wrong difficulty resets to bucket 0
    const wrongUpdate = update(initialBuckets, card, AnswerDifficulty.Wrong);
    assert.strictEqual(wrongUpdate.get(0)?.has(card), true);
  });
});

/*
 * Testing strategy for getHint():
 *
 * TODO: Describe your testing strategy for getHint() here.
 */
describe("getHint()", () => {
  it("returns existing hint if available", () => {
    const card = createFlashcard("Question", "Answer", "Existing Hint");
    assert.strictEqual(getHint(card), "Existing Hint");
  });

  it("generates hint for short strings", () => {
    const shortCard = createFlashcard("Hi", "Hello", "");
    const hint = getHint(shortCard);
    assert.strictEqual(hint, "H*");
  });

  it("generates hint for longer strings", () => {
    const longCard = createFlashcard("Python Programming", "A coding language", "");
    const hint = getHint(longCard);
    assert.strictEqual(hint, "Pyt***************");
  });
});

/*
 * Testing strategy for computeProgress():
 *
 * TODO: Describe your testing strategy for computeProgress() here.
 */

// Helper function to create flashcards

describe("computeProgress()", () => {
  it("correctly computes progress from buckets and history", () => {
    // Create flashcards
    const card1 = createFlashcard("Q1", "A1");
    const card2 = createFlashcard("Q2", "A2");
    const card3 = createFlashcard("Q3", "A3");

    // Create buckets map (Map of bucket number to a set of flashcards)
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set([card1])], // Bucket 0 has card1
      [2, new Set([card2])], // Bucket 2 has card2
      [6, new Set([card3])], // Bucket 6 has card3
    ]);

    // Create a history of answers with different difficulty levels
    const history = [
      { card: card1, difficulty: AnswerDifficulty.Easy },
      { card: card2, difficulty: AnswerDifficulty.Hard },
      { card: card3, difficulty: AnswerDifficulty.Easy },
      { card: card1, difficulty: AnswerDifficulty.Easy },
      { card: card2, difficulty: AnswerDifficulty.Hard },
      { card: card3, difficulty: AnswerDifficulty.Easy },
    ];

    // Call computeProgress
    const progress = computeProgress(buckets, history);

    // Assert total cards is correct
    assert.strictEqual(progress.totalCards, 3, "Total cards should be 3");

    // Assert average bucket is correct
    const expectedAverageBucket = (0 * 1 + 2 * 1 + 6 * 1) / 3;
    assert.strictEqual(progress.averageBucket, expectedAverageBucket, "Average bucket is incorrect");

    // Assert recent performance is correct (Easy answers / total recent answers)
    const recentPerformance = history.slice(-10).filter((attempt) => attempt.difficulty === AnswerDifficulty.Easy).length / 6;
    assert.strictEqual(progress.recentPerformance, recentPerformance, "Recent performance is incorrect");
  });
});


