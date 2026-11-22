// Platforms name the same topic differently ("Hash Table" on LeetCode, "Hash" on GFG).
// Keys are lowercase with single spaces; plural folding tries the key without a trailing "s".
const TOPIC_SYNONYMS: Record<string, string> = {
  array: 'Arrays',
  string: 'Strings',
  hash: 'Hashing',
  hashing: 'Hashing',
  'hash table': 'Hashing',
  'hash map': 'Hashing',
  hashmap: 'Hashing',
  'two pointer': 'Two Pointers',
  'two pointers': 'Two Pointers',
  'sliding window': 'Sliding Window',
  'linked list': 'Linked Lists',
  stack: 'Stacks',
  queue: 'Queues',
  heap: 'Heaps',
  'priority queue': 'Heaps',
  'heap (priority queue)': 'Heaps',
  tree: 'Trees',
  'binary tree': 'Trees',
  bst: 'Binary Search Trees',
  'binary search tree': 'Binary Search Trees',
  graph: 'Graphs',
  bfs: 'BFS',
  'breadth-first search': 'BFS',
  dfs: 'DFS',
  'depth-first search': 'DFS',
  dp: 'Dynamic Programming',
  'dynamic programming': 'Dynamic Programming',
  greedy: 'Greedy',
  backtracking: 'Backtracking',
  recursion: 'Recursion',
  'binary search': 'Binary Search',
  sorting: 'Sorting',
  math: 'Math',
  mathematical: 'Math',
  mathematics: 'Math',
  'bit manipulation': 'Bit Manipulation',
  'bit magic': 'Bit Manipulation',
  matrix: 'Matrix',
  trie: 'Tries',
  'prefix sum': 'Prefix Sum',
  'union find': 'Union Find',
  'disjoint set': 'Union Find',
  dsu: 'Union Find',
}

function titleCase(text: string): string {
  return text
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export function normalizeTopic(name: string): string | null {
  const collapsed = name.trim().replace(/\s+/g, ' ')
  if (!collapsed) return null

  const key = collapsed.toLowerCase()
  const synonym = TOPIC_SYNONYMS[key] ?? (key.endsWith('s') ? TOPIC_SYNONYMS[key.slice(0, -1)] : undefined)
  return synonym ?? titleCase(collapsed)
}

export function normalizeTopics(names: readonly string[]): string[] {
  const topics: string[] = []
  for (const name of names) {
    const topic = normalizeTopic(name)
    if (topic && !topics.includes(topic)) topics.push(topic)
  }
  return topics
}
