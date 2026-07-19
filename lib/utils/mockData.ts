import {
  DSAProblem,
  Subject,
  Project,
  AptitudeTopic,
  HRQuestion,
  Certification,
  ConceptTopic,
} from './storage'

const COMPACT_PROBLEMS = [
  // Day 1: Arrays
  { id: 'sde-1', name: 'Set Matrix Zeroes', link: 'https://leetcode.com/problems/set-matrix-zeroes/', topic: 'Arrays', pattern: 'Matrix', diff: 'Medium' },
  { id: 'sde-2', name: "Pascal's Triangle", link: 'https://leetcode.com/problems/pascals-triangle/', topic: 'Arrays', pattern: 'Array Traversal', diff: 'Easy' },
  { id: 'sde-3', name: 'Next Permutation', link: 'https://leetcode.com/problems/next-permutation/', topic: 'Arrays', pattern: 'Permutation', diff: 'Medium' },
  { id: 'sde-4', name: 'Maximum Subarray (Kadane\'s)', link: 'https://leetcode.com/problems/maximum-subarray/', topic: 'Arrays', pattern: 'Prefix Sum', diff: 'Medium' },
  { id: 'sde-5', name: 'Sort Colors (0s, 1s, 2s)', link: 'https://leetcode.com/problems/sort-colors/', topic: 'Arrays', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-6', name: 'Best Time to Buy and Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', topic: 'Arrays', pattern: 'Greedy', diff: 'Easy' },

  // Day 2: Arrays II
  { id: 'sde-7', name: 'Rotate Image (Rotate Matrix)', link: 'https://leetcode.com/problems/rotate-image/', topic: 'Arrays', pattern: 'Matrix', diff: 'Medium' },
  { id: 'sde-8', name: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/', topic: 'Arrays', pattern: 'Array Traversal', diff: 'Medium' },
  { id: 'sde-9', name: 'Merge Sorted Array', link: 'https://leetcode.com/problems/merge-sorted-array/', topic: 'Arrays', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-10', name: 'Find the Duplicate Number', link: 'https://leetcode.com/problems/find-the-duplicate-number/', topic: 'Arrays', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-11', name: 'Repeat and Missing Number', link: 'https://www.geeksforgeeks.org/find-a-repeating-and-a-missing-number/', topic: 'Arrays', pattern: 'Math', diff: 'Medium' },
  { id: 'sde-12', name: 'Count Inversions in an Array', link: 'https://www.geeksforgeeks.org/inversion-count-in-array-using-merge-sort/', topic: 'Arrays', pattern: 'Divide and Conquer', diff: 'Hard' },

  // Day 3: Arrays III
  { id: 'sde-13', name: 'Search a 2D Matrix', link: 'https://leetcode.com/problems/search-a-2d-matrix/', topic: 'Arrays', pattern: 'Binary Search', diff: 'Medium' },
  { id: 'sde-14', name: 'Pow(x, n)', link: 'https://leetcode.com/problems/powx-n/', topic: 'Arrays', pattern: 'Math', diff: 'Medium' },
  { id: 'sde-15', name: 'Majority Element (>N/2)', link: 'https://leetcode.com/problems/majority-element/', topic: 'Arrays', pattern: 'Voting Algorithm', diff: 'Easy' },
  { id: 'sde-16', name: 'Majority Element II (>N/3)', link: 'https://leetcode.com/problems/majority-element-ii/', topic: 'Arrays', pattern: 'Voting Algorithm', diff: 'Medium' },
  { id: 'sde-17', name: 'Unique Paths (Grid)', link: 'https://leetcode.com/problems/unique-paths/', topic: 'Arrays', pattern: 'Dynamic Programming', diff: 'Medium' },
  { id: 'sde-18', name: 'Reverse Pairs', link: 'https://leetcode.com/problems/reverse-pairs/', topic: 'Arrays', pattern: 'Divide and Conquer', diff: 'Hard' },

  // Day 4: Hashing
  { id: 'sde-19', name: '2 Sum', link: 'https://leetcode.com/problems/two-sum/', topic: 'Hashing', pattern: 'Hash Map', diff: 'Easy' },
  { id: 'sde-20', name: '4 Sum', link: 'https://leetcode.com/problems/4sum/', topic: 'Hashing', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-21', name: 'Longest Consecutive Sequence', link: 'https://leetcode.com/problems/longest-consecutive-sequence/', topic: 'Hashing', pattern: 'Hash Set', diff: 'Medium' },
  { id: 'sde-22', name: 'Largest Subarray with 0 Sum', link: 'https://www.geeksforgeeks.org/find-the-largest-subarray-with-0-sum/', topic: 'Hashing', pattern: 'Hash Map', diff: 'Medium' },
  { id: 'sde-23', name: 'Subarrays with Given XOR K', link: 'https://www.geeksforgeeks.org/count-number-subarrays-given-xor/', topic: 'Hashing', pattern: 'Hash Map', diff: 'Hard' },
  { id: 'sde-24', name: 'Longest Substring Without Repeating Characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', topic: 'Hashing', pattern: 'Sliding Window', diff: 'Medium' },

  // Day 5: Linked List
  { id: 'sde-25', name: 'Reverse Linked List', link: 'https://leetcode.com/problems/reverse-linked-list/', topic: 'Linked List', pattern: 'Linked List', diff: 'Easy' },
  { id: 'sde-26', name: 'Middle of the Linked List', link: 'https://leetcode.com/problems/middle-of-the-linked-list/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-27', name: 'Merge Two Sorted Lists', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', topic: 'Linked List', pattern: 'Linked List', diff: 'Easy' },
  { id: 'sde-28', name: 'Remove Nth Node From End of List', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-29', name: 'Add Two Numbers', link: 'https://leetcode.com/problems/add-two-numbers/', topic: 'Linked List', pattern: 'Linked List', diff: 'Medium' },
  { id: 'sde-30', name: 'Delete Node in a Linked List', link: 'https://leetcode.com/problems/delete-node-in-a-linked-list/', topic: 'Linked List', pattern: 'Linked List', diff: 'Medium' },

  // Day 6: Linked List II
  { id: 'sde-31', name: 'Intersection of Two Linked Lists', link: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-32', name: 'Linked List Cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-33', name: 'Reverse Nodes in k-Group', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', topic: 'Linked List', pattern: 'Linked List', diff: 'Hard' },
  { id: 'sde-34', name: 'Palindrome Linked List', link: 'https://leetcode.com/problems/palindrome-linked-list/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-35', name: 'Linked List Cycle II (Loop Start)', link: 'https://leetcode.com/problems/linked-list-cycle-ii/', topic: 'Linked List', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-36', name: 'Flattening a Linked List', link: 'https://www.geeksforgeeks.org/flattening-a-linked-list/', topic: 'Linked List', pattern: 'Linked List', diff: 'Medium' },

  // Day 7: Linked List and Arrays
  { id: 'sde-37', name: 'Rotate List', link: 'https://leetcode.com/problems/rotate-list/', topic: 'Linked List', pattern: 'Linked List', diff: 'Medium' },
  { id: 'sde-38', name: 'Clone List with Random Pointer', link: 'https://leetcode.com/problems/copy-list-with-random-pointer/', topic: 'Linked List', pattern: 'Linked List', diff: 'Medium' },
  { id: 'sde-39', name: '3Sum', link: 'https://leetcode.com/problems/3sum/', topic: 'Two Pointers', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-40', name: 'Trapping Rain Water', link: 'https://leetcode.com/problems/trapping-rain-water/', topic: 'Two Pointers', pattern: 'Two Pointers', diff: 'Hard' },
  { id: 'sde-41', name: 'Remove Duplicates from Sorted Array', link: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', topic: 'Two Pointers', pattern: 'Two Pointers', diff: 'Easy' },
  { id: 'sde-42', name: 'Max Consecutive Ones', link: 'https://leetcode.com/problems/max-consecutive-ones/', topic: 'Two Pointers', pattern: 'Sliding Window', diff: 'Easy' },

  // Day 8: Greedy
  { id: 'sde-43', name: 'N meetings in one room', link: 'https://www.geeksforgeeks.org/activity-selection-problem-greedy-algo-1/', topic: 'Greedy', pattern: 'Greedy', diff: 'Easy' },
  { id: 'sde-44', name: 'Minimum Platforms', link: 'https://www.geeksforgeeks.org/minimum-platforms-minimum-number-of-platforms-required-for-a-railway-bus-station/', topic: 'Greedy', pattern: 'Greedy', diff: 'Medium' },
  { id: 'sde-45', name: 'Job Sequencing Problem', link: 'https://www.geeksforgeeks.org/job-sequencing-problem/', topic: 'Greedy', pattern: 'Greedy', diff: 'Medium' },
  { id: 'sde-46', name: 'Fractional Knapsack', link: 'https://www.geeksforgeeks.org/fractional-knapsack-problem/', topic: 'Greedy', pattern: 'Greedy', diff: 'Medium' },
  { id: 'sde-47', name: 'Find Minimum Number of Coins', link: 'https://www.geeksforgeeks.org/greedy-algorithm-to-find-minimum-number-of-coins/', topic: 'Greedy', pattern: 'Greedy', diff: 'Easy' },

  // Day 9: Recursion
  { id: 'sde-48', name: 'Subset Sums', link: 'https://www.geeksforgeeks.org/print-sums-subsets-given-array/', topic: 'Recursion', pattern: 'Recursion', diff: 'Easy' },
  { id: 'sde-49', name: 'Subsets II', link: 'https://leetcode.com/problems/subsets-ii/', topic: 'Recursion', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-50', name: 'Combination Sum', link: 'https://leetcode.com/problems/combination-sum/', topic: 'Recursion', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-51', name: 'Combination Sum II', link: 'https://leetcode.com/problems/combination-sum-ii/', topic: 'Recursion', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-52', name: 'Palindrome Partitioning', link: 'https://leetcode.com/problems/palindrome-partitioning/', topic: 'Recursion', pattern: 'Backtracking', diff: 'Medium' },
  { id: 'sde-53', name: 'Permutation Sequence (K-th Perm)', link: 'https://leetcode.com/problems/permutation-sequence/', topic: 'Recursion', pattern: 'Math', diff: 'Hard' },

  // Day 10: Backtracking
  { id: 'sde-54', name: 'Permutations', link: 'https://leetcode.com/problems/permutations/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Medium' },
  { id: 'sde-55', name: 'N-Queens', link: 'https://leetcode.com/problems/n-queens/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Hard' },
  { id: 'sde-56', name: 'Sudoku Solver', link: 'https://leetcode.com/problems/sudoku-solver/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Hard' },
  { id: 'sde-57', name: 'M-Coloring Problem', link: 'https://www.geeksforgeeks.org/m-coloring-problem-backtracking-5/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Medium' },
  { id: 'sde-58', name: 'Rat in a Maze', link: 'https://www.geeksforgeeks.org/rat-in-a-maze-backtracking-2/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Medium' },
  { id: 'sde-59', name: 'Word Break II (Backtracking)', link: 'https://leetcode.com/problems/word-break-ii/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Hard' },

  // Day 11: Binary Search
  { id: 'sde-60', name: 'N-th Root of an Integer', link: 'https://www.geeksforgeeks.org/n-th-root-number/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Easy' },
  { id: 'sde-61', name: 'Matrix Median', link: 'https://www.interviewbit.com/problems/matrix-median/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Hard' },
  { id: 'sde-62', name: 'Single Element in a Sorted Array', link: 'https://leetcode.com/problems/single-element-in-a-sorted-array/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Medium' },
  { id: 'sde-63', name: 'Search in Rotated Sorted Array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Medium' },
  { id: 'sde-64', name: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Hard' },
  { id: 'sde-65', name: 'K-th Element of Two Sorted Arrays', link: 'https://www.geeksforgeeks.org/k-th-element-two-sorted-array/', topic: 'Binary Search', pattern: 'Binary Search', diff: 'Medium' },
  { id: 'sde-66', name: 'Allocate Books', link: 'https://www.interviewbit.com/problems/allocate-books/', topic: 'Binary Search', pattern: 'Search Space', diff: 'Hard' },
  { id: 'sde-67', name: 'Aggressive Cows', link: 'https://www.spoj.com/problems/AGGRCOW/', topic: 'Binary Search', pattern: 'Search Space', diff: 'Medium' },

  // Day 12: Heaps
  { id: 'sde-68', name: 'Kth Largest Element in an Array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', topic: 'Heap', pattern: 'Heap', diff: 'Medium' },
  { id: 'sde-69', name: 'Kth Largest Element in a Stream', link: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', topic: 'Heap', pattern: 'Heap', diff: 'Easy' },
  { id: 'sde-70', name: 'Find Median from Data Stream', link: 'https://leetcode.com/problems/find-median-from-data-stream/', topic: 'Heap', pattern: 'Heap', diff: 'Hard' },
  { id: 'sde-71', name: 'Merge K Sorted Lists', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', topic: 'Heap', pattern: 'Heap', diff: 'Hard' },
  { id: 'sde-72', name: 'Top K Frequent Elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', topic: 'Heap', pattern: 'Heap', diff: 'Medium' },

  // Day 13: Stacks & Queues
  { id: 'sde-73', name: 'Implement Stack using Queues', link: 'https://leetcode.com/problems/implement-stack-using-queues/', topic: 'Stack', pattern: 'Design', diff: 'Easy' },
  { id: 'sde-74', name: 'Implement Queue using Stacks', link: 'https://leetcode.com/problems/implement-queue-using-stacks/', topic: 'Queue', pattern: 'Design', diff: 'Easy' },
  { id: 'sde-75', name: 'Valid Parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', topic: 'Stack', pattern: 'Stack', diff: 'Easy' },
  { id: 'sde-76', name: 'Next Greater Element I', link: 'https://leetcode.com/problems/next-greater-element-i/', topic: 'Stack', pattern: 'Monotonic Stack', diff: 'Medium' },
  { id: 'sde-77', name: 'Sort a Stack (Recursion)', link: 'https://www.geeksforgeeks.org/sort-a-stack-using-recursion/', topic: 'Stack', pattern: 'Recursion', diff: 'Easy' },

  // Day 14: Stacks & Queues II
  { id: 'sde-78', name: 'LRU Cache', link: 'https://leetcode.com/problems/lru-cache/', topic: 'Stack', pattern: 'Design', diff: 'Medium' },
  { id: 'sde-79', name: 'LFU Cache', link: 'https://leetcode.com/problems/lfu-cache/', topic: 'Stack', pattern: 'Design', diff: 'Hard' },
  { id: 'sde-80', name: 'Largest Rectangle in Histogram', link: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', topic: 'Stack', pattern: 'Monotonic Stack', diff: 'Hard' },
  { id: 'sde-81', name: 'Sliding Window Maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', topic: 'Queue', pattern: 'Monotonic Queue', diff: 'Hard' },
  { id: 'sde-82', name: 'Min Stack', link: 'https://leetcode.com/problems/min-stack/', topic: 'Stack', pattern: 'Design', diff: 'Easy' },
  { id: 'sde-83', name: 'Rotting Oranges', link: 'https://leetcode.com/problems/rotting-oranges/', topic: 'Queue', pattern: 'BFS', diff: 'Medium' },

  // Day 15: String
  { id: 'sde-84', name: 'Reverse Words in a String', link: 'https://leetcode.com/problems/reverse-words-in-a-string/', topic: 'Strings', pattern: 'Two Pointers', diff: 'Medium' },
  { id: 'sde-85', name: 'Longest Palindromic Substring', link: 'https://leetcode.com/problems/longest-palindromic-substring/', topic: 'Strings', pattern: 'Dynamic Programming', diff: 'Medium' },
  { id: 'sde-86', name: 'Roman to Integer', link: 'https://leetcode.com/problems/roman-to-integer/', topic: 'Strings', pattern: 'Math', diff: 'Easy' },
  { id: 'sde-87', name: 'Integer to Roman', link: 'https://leetcode.com/problems/integer-to-roman/', topic: 'Strings', pattern: 'Math', diff: 'Medium' },
  { id: 'sde-88', name: 'Implement ATOI (String to Integer)', link: 'https://leetcode.com/problems/string-to-integer-atoi/', topic: 'Strings', pattern: 'Simulation', diff: 'Medium' },
  { id: 'sde-89', name: 'Longest Common Prefix', link: 'https://leetcode.com/problems/longest-common-prefix/', topic: 'Strings', pattern: 'Array Traversal', diff: 'Easy' },

  // Day 16: String II
  { id: 'sde-90', name: 'Rabin-Karp String Match', link: 'https://www.geeksforgeeks.org/rabin-karp-algorithm-for-pattern-searching/', topic: 'Strings', pattern: 'Rolling Hash', diff: 'Medium' },
  { id: 'sde-91', name: 'Z-Function Pattern Match', link: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', topic: 'Strings', pattern: 'Z-Algorithm', diff: 'Medium' },
  { id: 'sde-92', name: 'KMP Algorithm (LPS)', link: 'https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/', topic: 'Strings', pattern: 'KMP', diff: 'Hard' },
  { id: 'sde-93', name: 'Valid Anagram', link: 'https://leetcode.com/problems/valid-anagram/', topic: 'Strings', pattern: 'Hashing', diff: 'Easy' },
  { id: 'sde-94', name: 'Compare Version Numbers', link: 'https://leetcode.com/problems/compare-version-numbers/', topic: 'Strings', pattern: 'Two Pointers', diff: 'Medium' },

  // Day 17: Binary Tree
  { id: 'sde-95', name: 'Binary Tree Inorder Traversal', link: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-96', name: 'Binary Tree Preorder Traversal', link: 'https://leetcode.com/problems/binary-tree-preorder-traversal/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-97', name: 'Binary Tree Postorder Traversal', link: 'https://leetcode.com/problems/binary-tree-postorder-traversal/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-98', name: 'Left View of Binary Tree', link: 'https://www.geeksforgeeks.org/print-left-view-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-99', name: 'Right View of Binary Tree', link: 'https://leetcode.com/problems/binary-tree-right-side-view/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-100', name: 'Top View of Binary Tree', link: 'https://www.geeksforgeeks.org/print-nodes-in-top-view-of-binary-tree/', topic: 'Trees', pattern: 'BFS', diff: 'Medium' },
  { id: 'sde-101', name: 'Bottom View of Binary Tree', link: 'https://www.geeksforgeeks.org/bottom-view-binary-tree/', topic: 'Trees', pattern: 'BFS', diff: 'Medium' },

  // Day 18: Binary Tree II
  { id: 'sde-102', name: 'Maximum Depth of Binary Tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-103', name: 'Diameter of Binary Tree', link: 'https://leetcode.com/problems/diameter-of-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-104', name: 'Balanced Binary Tree Check', link: 'https://leetcode.com/problems/balanced-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-105', name: 'Lowest Common Ancestor (LCA)', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-106', name: 'Same Tree Check', link: 'https://leetcode.com/problems/same-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-107', name: 'Binary Tree Zigzag Level Traversal', link: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/', topic: 'Trees', pattern: 'BFS', diff: 'Medium' },

  // Day 19: Binary Tree III
  { id: 'sde-108', name: 'Construct Tree from Preorder & Inorder', link: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', topic: 'Trees', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-109', name: 'Construct Tree from Postorder & Inorder', link: 'https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/', topic: 'Trees', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-110', name: 'Symmetric Tree', link: 'https://leetcode.com/problems/symmetric-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-111', name: 'Flatten Binary Tree to Linked List', link: 'https://leetcode.com/problems/flatten-binary-tree-to-linked-list/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },

  // Day 20: Binary Search Tree
  { id: 'sde-112', name: 'Populating Next Right Pointers', link: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node/', topic: 'BST', pattern: 'BFS', diff: 'Medium' },
  { id: 'sde-113', name: 'Search in a Binary Search Tree', link: 'https://leetcode.com/problems/search-in-a-binary-search-tree/', topic: 'BST', pattern: 'BST Ops', diff: 'Easy' },
  { id: 'sde-114', name: 'Convert Sorted Array to BST', link: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/', topic: 'BST', pattern: 'Recursion', diff: 'Easy' },
  { id: 'sde-115', name: 'Construct BST from Preorder', link: 'https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/', topic: 'BST', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-116', name: 'Validate Binary Search Tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', topic: 'BST', pattern: 'BST Ops', diff: 'Medium' },

  // Day 21: BST II
  { id: 'sde-117', name: 'LCA of a Binary Search Tree', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', topic: 'BST', pattern: 'BST Ops', diff: 'Easy' },
  { id: 'sde-118', name: 'Kth Smallest Element in a BST', link: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', topic: 'BST', pattern: 'Inorder', diff: 'Medium' },
  { id: 'sde-119', name: 'Kth Largest Element in a BST', link: 'https://www.geeksforgeeks.org/kth-largest-element-in-bst-when-modification-to-bst-is-not-allowed/', topic: 'BST', pattern: 'Inorder', diff: 'Medium' },
  { id: 'sde-120', name: 'BST Iterator', link: 'https://leetcode.com/problems/binary-search-tree-iterator/', topic: 'BST', pattern: 'Design', diff: 'Medium' },
  { id: 'sde-121', name: 'Two Sum IV - Input is a BST', link: 'https://leetcode.com/problems/two-sum-iv-input-is-a-bst/', topic: 'BST', pattern: 'BST Ops', diff: 'Easy' },

  // Day 22: Mixed Questions
  { id: 'sde-122', name: 'Binary Tree Maximum Path Sum', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', topic: 'Trees', pattern: 'DFS', diff: 'Hard' },
  { id: 'sde-123', name: 'K-th Largest Element in Stream', link: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', topic: 'Heap', pattern: 'Heap', diff: 'Easy' },
  { id: 'sde-124', name: 'Flatten BST to Sorted Linked List', link: 'https://www.geeksforgeeks.org/flatten-bst-to-sorted-list-inplace/', topic: 'BST', pattern: 'BST Ops', diff: 'Medium' },

  // Day 23: Graph
  { id: 'sde-125', name: 'BFS of Graph', link: 'https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/', topic: 'Graphs', pattern: 'BFS', diff: 'Easy' },
  { id: 'sde-126', name: 'DFS of Graph', link: 'https://www.geeksforgeeks.org/depth-first-search-or-dfs-for-a-graph/', topic: 'Graphs', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-1Cycle', name: 'Cycle Detection in Undirected Graph', link: 'https://www.geeksforgeeks.org/detect-cycle-undirected-graph/', topic: 'Graphs', pattern: 'BFS/DFS', diff: 'Medium' },
  { id: 'sde-128', name: 'Cycle Detection in Directed Graph', link: 'https://www.geeksforgeeks.org/detect-cycle-in-a-directed-graph/', topic: 'Graphs', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-129', name: 'Topological Sort (Kahn\'s Algorithm)', link: 'https://www.geeksforgeeks.org/topological-sorting/', topic: 'Graphs', pattern: 'BFS/DFS', diff: 'Medium' },
  { id: 'sde-130', name: 'Bipartite Graph Check', link: 'https://leetcode.com/problems/is-graph-bipartite/', topic: 'Graphs', pattern: 'BFS/DFS', diff: 'Medium' },

  // Day 24: Graph II
  { id: 'sde-131', name: 'Dijkstra\'s Shortest Path Algorithm', link: 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-132', name: 'Bellman-Ford Algorithm', link: 'https://www.geeksforgeeks.org/bellman-ford-algorithm-dp-23/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-133', name: 'Floyd-Warshall Algorithm', link: 'https://www.geeksforgeeks.org/floyd-warshall-algorithm-dp-16/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-134', name: 'Prim\'s Minimum Spanning Tree MST', link: 'https://www.geeksforgeeks.org/prims-minimum-spanning-tree-mst-greedy-algo-5/', topic: 'Graphs', pattern: 'MST', diff: 'Medium' },
  { id: 'sde-135', name: 'Kruskal\'s MST Algorithm', link: 'https://www.geeksforgeeks.org/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/', topic: 'Graphs', pattern: 'MST', diff: 'Medium' },
  { id: 'sde-136', name: 'Strongly Connected Components (Kosaraju)', link: 'https://www.geeksforgeeks.org/strongly-connected-components/', topic: 'Graphs', pattern: 'DFS', diff: 'Hard' },

  // Day 25: DP
  { id: 'sde-137', name: 'Maximum Product Subarray', link: 'https://leetcode.com/problems/maximum-product-subarray/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-138', name: 'Longest Increasing Subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-139', name: 'Longest Common Subsequence', link: 'https://leetcode.com/problems/longest-common-subsequence/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-140', name: '0-1 Knapsack Problem', link: 'https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-141', name: 'Edit Distance', link: 'https://leetcode.com/problems/edit-distance/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Hard' },
  { id: 'sde-142', name: 'Partition Equal Subset Sum', link: 'https://leetcode.com/problems/partition-equal-subset-sum/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },

  // Day 26: DP II
  { id: 'sde-143', name: 'Matrix Chain Multiplication', link: 'https://www.geeksforgeeks.org/matrix-chain-multiplication-dp-8/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Hard' },
  { id: 'sde-144', name: 'Maximum Path Sum in Grid', link: 'https://leetcode.com/problems/minimum-path-sum/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-145', name: 'Coin Change Problem', link: 'https://leetcode.com/problems/coin-change/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-146', name: 'Subset Sum Equals Target', link: 'https://www.geeksforgeeks.org/subset-sum-problem-dp-25/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-147', name: 'Rod Cutting Problem', link: 'https://www.geeksforgeeks.org/rod-cutting-problem-dp-13/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },

  // Additional SDE Problems to cover full 191 list
  { id: 'sde-148', name: 'Minimum Path Sum (Grid)', link: 'https://leetcode.com/problems/minimum-path-sum/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-149', name: 'Rod Cutting Max Profit', link: 'https://www.geeksforgeeks.org/rod-cutting-problem-dp-13/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-150', name: 'Egg Dropping Puzzle', link: 'https://www.geeksforgeeks.org/egg-dropping-puzzle-dp-11/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Hard' },
  { id: 'sde-151', name: 'Word Break Problem', link: 'https://leetcode.com/problems/word-break/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Medium' },
  { id: 'sde-152', name: 'Palindrome Partitioning II (Min Cuts)', link: 'https://leetcode.com/problems/palindrome-partitioning-ii/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Hard' },
  { id: 'sde-153', name: 'Job Scheduling (Maximum Profit)', link: 'https://leetcode.com/problems/maximum-profit-in-job-scheduling/', topic: 'Dynamic Programming', pattern: 'DP', diff: 'Hard' },
  { id: 'sde-154', name: 'Word Search (Grid)', link: 'https://leetcode.com/problems/word-search/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Medium' },
  { id: 'sde-155', name: 'Word Search II', link: 'https://leetcode.com/problems/word-search-ii/', topic: 'Backtracking', pattern: 'Backtracking', diff: 'Hard' },
  { id: 'sde-156', name: 'Topological Sort (DFS Approach)', link: 'https://www.geeksforgeeks.org/topological-sorting/', topic: 'Graphs', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-157', name: 'Course Schedule II', link: 'https://leetcode.com/problems/course-schedule-ii/', topic: 'Graphs', pattern: 'Topological Sort', diff: 'Medium' },
  { id: 'sde-158', name: 'Bipartite Graph (BFS Approach)', link: 'https://leetcode.com/problems/is-graph-bipartite/', topic: 'Graphs', pattern: 'BFS', diff: 'Medium' },
  { id: 'sde-159', name: 'Bipartite Graph (DFS Approach)', link: 'https://leetcode.com/problems/is-graph-bipartite/', topic: 'Graphs', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-160', name: 'Number of Provinces', link: 'https://leetcode.com/problems/number-of-provinces/', topic: 'Graphs', pattern: 'BFS/DFS', diff: 'Medium' },
  { id: 'sde-161', name: 'Number of Islands', link: 'https://leetcode.com/problems/number-of-islands/', topic: 'Graphs', pattern: 'BFS/DFS', diff: 'Medium' },
  { id: 'sde-162', name: 'Word Ladder I (Shortest Path)', link: 'https://leetcode.com/problems/word-ladder/', topic: 'Graphs', pattern: 'BFS', diff: 'Hard' },
  { id: 'sde-163', name: 'Word Ladder II (All Paths)', link: 'https://leetcode.com/problems/word-ladder-ii/', topic: 'Graphs', pattern: 'BFS', diff: 'Hard' },
  { id: 'sde-164', name: 'Bridges in Graph (Tarjan\'s)', link: 'https://leetcode.com/problems/critical-connections-in-a-network/', topic: 'Graphs', pattern: 'DFS', diff: 'Hard' },
  { id: 'sde-165', name: 'Strongly Connected Components (Tarjan\'s)', link: 'https://www.geeksforgeeks.org/tarjan-algorithm-find-strongly-connected-components/', topic: 'Graphs', pattern: 'DFS', diff: 'Hard' },
  { id: 'sde-166', name: 'Dijkstra (Adjacency List & Heap)', link: 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-using-priority_queue-in-stl/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-167', name: 'Bellman Ford (Negative Edge Cycles)', link: 'https://www.geeksforgeeks.org/bellman-ford-algorithm-dp-23/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-168', name: 'Floyd Warshall (All Pairs Shortest)', link: 'https://www.geeksforgeeks.org/floyd-warshall-algorithm-dp-16/', topic: 'Graphs', pattern: 'Shortest Path', diff: 'Medium' },
  { id: 'sde-169', name: 'Prim\'s MST (Adjacency List & Heap)', link: 'https://www.geeksforgeeks.org/prims-mst-for-adjacency-list-representation-greedy-algo-6/', topic: 'Graphs', pattern: 'MST', diff: 'Medium' },
  { id: 'sde-170', name: 'Kruskal MST (Union Find Basis)', link: 'https://www.geeksforgeeks.org/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/', topic: 'Graphs', pattern: 'MST', diff: 'Medium' },
  { id: 'sde-171', name: 'Disjoint Set Union (Rank & Size)', link: 'https://www.geeksforgeeks.org/disjoint-set-data-structure-union-find-algorithm/', topic: 'Graphs', pattern: 'Union Find', diff: 'Medium' },
  { id: 'sde-172', name: 'Kth Smallest Element in BST (Iterative)', link: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', topic: 'BST', pattern: 'BST Ops', diff: 'Medium' },
  { id: 'sde-173', name: 'Kth Largest Element in BST (Iterative)', link: 'https://www.geeksforgeeks.org/kth-largest-element-in-bst-when-modification-to-bst-is-not-allowed/', topic: 'BST', pattern: 'BST Ops', diff: 'Medium' },
  { id: 'sde-174', name: 'Two Sum in BST (Two Pointer Method)', link: 'https://leetcode.com/problems/two-sum-iv-input-is-a-bst/', topic: 'BST', pattern: 'BST Ops', diff: 'Easy' },
  { id: 'sde-175', name: 'BST Iterator (Optimal Space)', link: 'https://leetcode.com/problems/binary-search-tree-iterator/', topic: 'BST', pattern: 'Design', diff: 'Medium' },
  { id: 'sde-176', name: 'Largest BST in Binary Tree', link: 'https://www.geeksforgeeks.org/largest-bst-binary-tree/', topic: 'BST', pattern: 'BST Ops', diff: 'Hard' },
  { id: 'sde-177', name: 'Serialize and Deserialize Binary Tree', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', topic: 'Trees', pattern: 'BFS/DFS', diff: 'Hard' },
  { id: 'sde-178', name: 'Flatten Binary Tree to DLL', link: 'https://www.geeksforgeeks.org/convert-a-given-binary-tree-to-doubly-linked-list-set-1/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-179', name: 'Populating Next Right Pointers II', link: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/', topic: 'BST', pattern: 'BFS', diff: 'Medium' },
  { id: 'sde-180', name: 'Binary Tree Max Path Sum (Any Node)', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', topic: 'Trees', pattern: 'DFS', diff: 'Hard' },
  { id: 'sde-181', name: 'Boundary Traversal of Binary Tree', link: 'https://www.geeksforgeeks.org/boundary-traversal-of-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-182', name: 'Vertical Order Traversal of Tree', link: 'https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/', topic: 'Trees', pattern: 'DFS/BFS', diff: 'Hard' },
  { id: 'sde-183', name: 'Construct Tree from Postorder & Inorder', link: 'https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/', topic: 'Trees', pattern: 'Recursion', diff: 'Medium' },
  { id: 'sde-184', name: 'LCA of Binary Tree (Recursion)', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-185', name: 'Same Tree (Node Comparison)', link: 'https://leetcode.com/problems/same-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-186', name: 'Check Balanced Tree (DFS Depth)', link: 'https://leetcode.com/problems/balanced-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-187', name: 'Diameter of Binary Tree (Depth)', link: 'https://leetcode.com/problems/diameter-of-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-188', name: 'Height of Binary Tree (Nodes Count)', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
  { id: 'sde-189', name: 'Pre, Post, Inorder in One Traversal', link: 'https://www.geeksforgeeks.org/preorder-postorder-and-inorder-traversal-of-a-binary-tree-in-a-single-traversal/', topic: 'Trees', pattern: 'DFS', diff: 'Medium' },
  { id: 'sde-190', name: 'Level Order Traversal BFS', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', topic: 'Trees', pattern: 'BFS', diff: 'Easy' },
  { id: 'sde-191', name: 'Tree Traversals Basics', link: 'https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/', topic: 'Trees', pattern: 'DFS', diff: 'Easy' },
]

export const SEED_DSA_PROBLEMS: DSAProblem[] = COMPACT_PROBLEMS.map((p, idx) => ({
  id: p.id,
  problemName: p.name,
  link: p.link,
  pattern: p.pattern,
  dataStructures: [p.topic],
  topic: p.topic,
  approach: `Practice and review ${p.name} using standard ${p.pattern} techniques.`,
  constraints: 'Standard problem constraints apply.',
  recognitionTrigger: `Recognized for ${p.topic} / ${p.pattern} category placement prep.`,
  keyInsight: 'Optimize time and space complexity using ideal data structures.',
  timeComplexity: p.diff === 'Easy' ? 'O(N)' : p.diff === 'Medium' ? 'O(N log N)' : 'O(N^2)',
  spaceComplexity: 'O(1)',
  pitfalls: 'Edge cases: empty inputs, negative integers, overflow constraints.',
  explanation: `Detailed explanation of the solution logic for ${p.name}.`,
  code: `class Solution:\n    # Python template for ${p.name}\n    pass`,
  personalNotes: '',
  difficulty: p.diff as any,
  status: 'Not Started',
  dateAdded: new Date(Date.now() - (191 - idx) * 24 * 60 * 60 * 1000).toISOString(),
  lastRevised: new Date().toISOString()
}))

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'aptitude',
    name: 'Aptitude',
    topics: [
      { id: 'apt-1', name: 'Quantitative Aptitude', completed: false, resourceLink: 'https://www.indiabix.com/quantitative-aptitude/questions-and-answers/', notes: 'Number system, percentages, profit & loss, time & work, permutations & combinations.' },
      { id: 'apt-2', name: 'Logical Reasoning', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/questions-and-answers/', notes: 'Coding decoding, blood relations, direction sense, seating arrangement, puzzles, syllogism.' },
      { id: 'apt-3', name: 'Verbal Ability', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/questions-and-answers/', notes: 'Reading comprehension, sentence correction, para jumbles, vocabulary, analogies.' },
    ]
  },
  {
    id: 'os',
    name: 'Operating Systems',
    topics: [
      { id: 'os-1', name: 'Introduction to OS', completed: true, resourceLink: 'https://www.geeksforgeeks.org/operating-systems/', notes: 'Learned definition, functions, types of OS.' },
      { id: 'os-2', name: 'System Calls', completed: true, resourceLink: 'https://www.geeksforgeeks.org/system-calls-in-operating-system-of-operating-system/', notes: 'Covered fork, exec, wait, read, write.' },
      { id: 'os-3', name: 'Processes', completed: false, resourceLink: 'https://www.geeksforgeeks.org/process-states-in-operating-system-of-operating-system/', notes: 'Process control blocks, states, and process lifecycles.' },
      { id: 'os-4', name: 'Threads', completed: false, resourceLink: 'https://www.geeksforgeeks.org/thread-in-operating-system/', notes: '' },
      { id: 'os-5', name: 'CPU Scheduling', completed: false, resourceLink: 'https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/', notes: 'Need to review FCFS, SJF, SRTF, Round Robin.' },
      { id: 'os-6', name: 'Process Synchronization', completed: false, resourceLink: 'https://www.geeksforgeeks.org/process-synchronization-in-operating-system-of-operating-system/', notes: 'Critical section problem, semaphores, mutexes.' },
      { id: 'os-7', name: 'Deadlocks', completed: false, resourceLink: 'https://www.geeksforgeeks.org/deadlock-in-operating-system-of-operating-system/', notes: 'Deadlock detection, prevention, avoidance (Banker\'s algorithm).' },
      { id: 'os-8', name: 'Memory Management', completed: false, resourceLink: 'https://www.geeksforgeeks.org/memory-management-in-operating-system/', notes: '' },
      { id: 'os-9', name: 'Paging', completed: false, resourceLink: 'https://www.geeksforgeeks.org/paging-in-operating-system/', notes: '' },
      { id: 'os-10', name: 'Segmentation', completed: false, resourceLink: 'https://www.geeksforgeeks.org/difference-between-paging-and-segmentation/', notes: '' },
      { id: 'os-11', name: 'Virtual Memory', completed: false, resourceLink: 'https://www.geeksforgeeks.org/virtual-memory-in-operating-system/', notes: 'Page replacement algorithms (FIFO, LRU, Optimal).' },
      { id: 'os-12', name: 'File Systems', completed: false, resourceLink: 'https://www.geeksforgeeks.org/file-systems-in-operating-system/', notes: '' },
      { id: 'os-13', name: 'Disk Scheduling', completed: false, resourceLink: 'https://www.geeksforgeeks.org/disk-scheduling-algorithms/', notes: 'FCFS, SSTF, SCAN, C-SCAN.' },
      { id: 'os-14', name: 'I/O Systems', completed: false, resourceLink: 'https://www.geeksforgeeks.org/input-output-systems-in-operating-system-of-operating-system/', notes: '' },
      { id: 'os-15', name: 'Security & Protection', completed: false, resourceLink: 'https://www.geeksforgeeks.org/protection-and-security-in-operating-system-of-operating-system/', notes: '' },
    ]
  },
  {
    id: 'dbms',
    name: 'Database Management Systems',
    topics: [
      { id: 'dbms-1', name: 'Introduction to DBMS', completed: true, resourceLink: 'https://www.geeksforgeeks.org/introduction-of-dbms-database-management-system-set-1/', notes: 'File systems vs DBMS, schemas, instances, architectures.' },
      { id: 'dbms-2', name: 'ER Model', completed: true, resourceLink: 'https://www.geeksforgeeks.org/er-model-in-dbms/', notes: 'Entities, attributes, relationships, cardinalities.' },
      { id: 'dbms-3', name: 'Relational Model', completed: false, resourceLink: 'https://www.geeksforgeeks.org/relational-model-in-dbms/', notes: 'Relational algebra, relational constraints.' },
      { id: 'dbms-4', name: 'SQL', completed: false, resourceLink: 'https://www.geeksforgeeks.org/sql-tutorial/', notes: 'DDL, DML, DCL, TCL, subqueries.' },
      { id: 'dbms-5', name: 'Joins', completed: false, resourceLink: 'https://www.geeksforgeeks.org/joins-in-dbms/', notes: 'Inner, Left, Right, Full Outer Joins.' },
      { id: 'dbms-6', name: 'Normalization', completed: false, resourceLink: 'https://www.geeksforgeeks.org/normal-forms-in-dbms/', notes: '1NF, 2NF, 3NF, BCNF.' },
      { id: 'dbms-7', name: 'Functional Dependencies', completed: false, resourceLink: 'https://www.geeksforgeeks.org/functional-dependency-and-attribute-closure/', notes: 'Closure, minimal cover, lossless join dependency.' },
      { id: 'dbms-8', name: 'Transactions', completed: false, resourceLink: 'https://www.geeksforgeeks.org/acid-properties-in-dbms/', notes: 'ACID properties, transaction states.' },
      { id: 'dbms-9', name: 'Concurrency Control', completed: false, resourceLink: 'https://www.geeksforgeeks.org/concurrency-control-in-dbms/', notes: 'Dirty read, unrepeatable read, phantom read problems.' },
      { id: 'dbms-10', name: 'Locking Protocols', completed: false, resourceLink: 'https://www.geeksforgeeks.org/two-phase-locking-protocol-2pl/', notes: 'Shared/exclusive locks, 2-phase locking (2PL).' },
      { id: 'dbms-11', name: 'Serializability', completed: false, resourceLink: 'https://www.geeksforgeeks.org/serializability-in-dbms/', notes: 'Conflict and view serializability.' },
      { id: 'dbms-12', name: 'Indexing', completed: false, resourceLink: 'https://www.geeksforgeeks.org/indexing-in-databases-set-1/', notes: 'Primary, secondary, clustered indexes.' },
      { id: 'dbms-13', name: 'B+ Trees', completed: false, resourceLink: 'https://www.geeksforgeeks.org/b-trees-in-dbms/', notes: '' },
      { id: 'dbms-14', name: 'Query Processing', completed: false, resourceLink: 'https://www.geeksforgeeks.org/query-processing-and-optimization-in-dbms/', notes: '' },
      { id: 'dbms-15', name: 'Query Optimization', completed: false, resourceLink: 'https://www.geeksforgeeks.org/query-optimization-in-dbms-with-examples/', notes: '' },
      { id: 'dbms-16', name: 'Recovery', completed: false, resourceLink: 'https://www.geeksforgeeks.org/database-recovery-techniques-in-dbms/', notes: 'Log-based recovery, checkpoints.' },
      { id: 'dbms-17', name: 'Distributed Databases', completed: false, resourceLink: 'https://www.geeksforgeeks.org/distributed-database-system/', notes: '' },
    ]
  },
  {
    id: 'networks',
    name: 'Computer Networks',
    topics: [
      { id: 'net-1', name: 'Network Basics', completed: true, resourceLink: 'https://www.geeksforgeeks.org/computer-network-tutorials/', notes: 'Topologies, LAN/WAN, network hardware.' },
      { id: 'net-2', name: 'OSI Model', completed: true, resourceLink: 'https://www.geeksforgeeks.org/layers-of-osi-model/', notes: 'All 7 layers, duties, and data units.' },
      { id: 'net-3', name: 'TCP/IP Model', completed: false, resourceLink: 'https://www.geeksforgeeks.org/tcp-ip-model/', notes: '' },
      { id: 'net-4', name: 'Physical Layer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/physical-layer-in-osi-model/', notes: '' },
      { id: 'net-5', name: 'Data Link Layer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/data-link-layer-in-osi-model/', notes: 'Framing, error control, flow control.' },
      { id: 'net-6', name: 'Network Layer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/network-layer-in-osi-model/', notes: 'IP packet, routing algorithms.' },
      { id: 'net-7', name: 'Transport Layer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/transport-layer-in-osi-model/', notes: 'Port addressing, segmenting.' },
      { id: 'net-8', name: 'Application Layer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/application-layer-in-osi-model/', notes: '' },
      { id: 'net-9', name: 'IP Addressing', completed: false, resourceLink: 'https://www.geeksforgeeks.org/ip-addressing-structure-and-classes-of-computer-networks/', notes: 'IPv4 vs IPv6, classes.' },
      { id: 'net-10', name: 'Subnetting', completed: false, resourceLink: 'https://www.geeksforgeeks.org/subnetting-in-computer-networks-of-computer-networks/', notes: 'FLSM, VLSM calculations.' },
      { id: 'net-11', name: 'Routing', completed: false, resourceLink: 'https://www.geeksforgeeks.org/routing-v-s-routed-protocols-in-computer-networks/', notes: 'Static vs dynamic, RIP, OSPF, BGP.' },
      { id: 'net-12', name: 'ARP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/how-address-resolution-protocol-arp-works/', notes: '' },
      { id: 'net-13', name: 'ICMP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/internet-control-message-protocol-icmp/', notes: 'Ping, traceroute.' },
      { id: 'net-14', name: 'TCP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/what-is-tcp-transmission-control-protocol-of-computer-networks/', notes: '3-way handshake, state transitions.' },
      { id: 'net-15', name: 'UDP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/user-datagram-protocol-udp/', notes: '' },
      { id: 'net-16', name: 'HTTP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/hypertext-transfer-protocol-http-of-computer-networks/', notes: '' },
      { id: 'net-17', name: 'HTTPS', completed: false, resourceLink: 'https://www.geeksforgeeks.org/difference-between-http-and-https/', notes: 'SSL/TLS handshake.' },
      { id: 'net-18', name: 'DNS', completed: false, resourceLink: 'https://www.geeksforgeeks.org/dns-domain-name-server/', notes: '' },
      { id: 'net-19', name: 'DHCP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/how-dhcp-server-dynamically-allocates-ip-address-in-computer-network/', notes: '' },
      { id: 'net-20', name: 'FTP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/file-transfer-protocol-ftp/', notes: '' },
      { id: 'net-21', name: 'SMTP', completed: false, resourceLink: 'https://www.geeksforgeeks.org/simple-mail-transfer-protocol-smtp/', notes: '' },
      { id: 'net-22', name: 'Congestion Control', completed: false, resourceLink: 'https://www.geeksforgeeks.org/congestion-control-in-computer-networks/', notes: 'Leaky bucket, token bucket.' },
      { id: 'net-23', name: 'Flow Control', completed: false, resourceLink: 'https://www.geeksforgeeks.org/flow-control-in-data-link-layer/', notes: 'Stop and Wait, Go-Back-N, Selective Repeat.' },
      { id: 'net-24', name: 'Network Security', completed: false, resourceLink: 'https://www.geeksforgeeks.org/what-is-network-security-in-computer-network/', notes: 'Firewalls, cryptography, symmetric/asymmetric.' },
    ]
  },
  {
    id: 'oop',
    name: 'Object Oriented Programming',
    topics: [
      { id: 'oop-1', name: 'OOP Principles', completed: true, resourceLink: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/', notes: '4 Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism.' },
      { id: 'oop-2', name: 'Classes & Objects', completed: true, resourceLink: 'https://www.geeksforgeeks.org/classes-objects-java/', notes: '' },
      { id: 'oop-3', name: 'Constructors', completed: false, resourceLink: 'https://www.geeksforgeeks.org/constructors-in-java/', notes: 'Default, parameterized, copy constructors.' },
      { id: 'oop-4', name: 'Encapsulation', completed: false, resourceLink: 'https://www.geeksforgeeks.org/encapsulation-in-java/', notes: 'Data hiding, getters/setters.' },
      { id: 'oop-5', name: 'Abstraction', completed: false, resourceLink: 'https://www.geeksforgeeks.org/abstraction-in-java-2/', notes: 'Hiding implementation details.' },
      { id: 'oop-6', name: 'Inheritance', completed: false, resourceLink: 'https://www.geeksforgeeks.org/inheritance-in-java/', notes: 'Single, multilevel, hierarchical, multiple.' },
      { id: 'oop-7', name: 'Polymorphism', completed: false, resourceLink: 'https://www.geeksforgeeks.org/polymorphism-in-java/', notes: '' },
      { id: 'oop-8', name: 'Method Overloading', completed: false, resourceLink: 'https://www.geeksforgeeks.org/method-overloading-in-java/', notes: 'Compile time polymorphism.' },
      { id: 'oop-9', name: 'Method Overriding', completed: false, resourceLink: 'https://www.geeksforgeeks.org/method-overriding-in-java-with-examples/', notes: 'Runtime polymorphism.' },
      { id: 'oop-10', name: 'Interfaces', completed: false, resourceLink: 'https://www.geeksforgeeks.org/interfaces-in-java/', notes: '' },
      { id: 'oop-11', name: 'Abstract Classes', completed: false, resourceLink: 'https://www.geeksforgeeks.org/difference-between-abstract-class-and-interface-in-java/', notes: 'Abstract class vs interface.' },
      { id: 'oop-12', name: 'Exception Handling', completed: false, resourceLink: 'https://www.geeksforgeeks.org/exceptions-in-java/', notes: 'Checked vs unchecked, try-catch-finally, custom exceptions.' },
      { id: 'oop-13', name: 'Collections', completed: false, resourceLink: 'https://www.geeksforgeeks.org/collections-in-java-2/', notes: 'List, Set, Map implementation details.' },
      { id: 'oop-14', name: 'Generics', completed: false, resourceLink: 'https://www.geeksforgeeks.org/generics-in-java/', notes: '' },
      { id: 'oop-15', name: 'Multithreading', completed: false, resourceLink: 'https://www.geeksforgeeks.org/multithreading-in-java/', notes: 'Thread class, Runnable interface, synchronization.' },
      { id: 'oop-16', name: 'File Handling', completed: false, resourceLink: 'https://www.geeksforgeeks.org/file-handling-in-java/', notes: '' },
    ]
  },
  {
    id: 'systemdesign',
    name: 'System Design',
    topics: [
      { id: 'sd-1', name: 'Functional Requirements', completed: true, resourceLink: 'https://www.geeksforgeeks.org/functional-vs-non-functional-requirements/', notes: 'Defining system API, endpoints, and behaviors.' },
      { id: 'sd-2', name: 'Non-functional Requirements', completed: true, resourceLink: 'https://www.geeksforgeeks.org/functional-vs-non-functional-requirements/', notes: 'Availability, latency, throughput, consistency, durability.' },
      { id: 'sd-3', name: 'Scalability', completed: false, resourceLink: 'https://www.geeksforgeeks.org/horizontal-vs-vertical-scaling-system-design/', notes: 'Horizontal vs vertical scaling.' },
      { id: 'sd-4', name: 'Load Balancer', completed: false, resourceLink: 'https://www.geeksforgeeks.org/load-balancer-system-design/', notes: 'Algorithms: Round Robin, Least Connections, Consistent Hashing.' },
      { id: 'sd-5', name: 'Reverse Proxy', completed: false, resourceLink: 'https://www.geeksforgeeks.org/difference-between-proxy-and-reverse-proxy-in-system-design/', notes: '' },
      { id: 'sd-6', name: 'CDN', completed: false, resourceLink: 'https://www.geeksforgeeks.org/content-delivery-network-cdn-system-design/', notes: 'Edge servers, caching media files.' },
      { id: 'sd-7', name: 'Caching', completed: false, resourceLink: 'https://www.geeksforgeeks.org/caching-system-design-interview-concept/', notes: 'Write-through, write-back, evictions (LRU, LFU).' },
      { id: 'sd-8', name: 'Database Scaling', completed: false, resourceLink: 'https://www.geeksforgeeks.org/scaling-database-system-design/', notes: '' },
      { id: 'sd-9', name: 'Replication', completed: false, resourceLink: 'https://www.geeksforgeeks.org/database-replication-system-design/', notes: 'Leader-follower, multi-leader, leaderless.' },
      { id: 'sd-10', name: 'Sharding', completed: false, resourceLink: 'https://www.geeksforgeeks.org/database-sharding-in-system-design/', notes: 'Horizontal partitioning.' },
      { id: 'sd-11', name: 'CAP Theorem', completed: false, resourceLink: 'https://www.geeksforgeeks.org/cap-theorem-in-system-design/', notes: 'Consistency, Availability, Partition tolerance.' },
      { id: 'sd-12', name: 'Consistent Hashing', completed: false, resourceLink: 'https://www.geeksforgeeks.org/consistent-hashing-in-system-design/', notes: 'Hash ring, virtual nodes.' },
      { id: 'sd-13', name: 'Message Queues', completed: false, resourceLink: 'https://www.geeksforgeeks.org/message-queues-system-design/', notes: 'Kafka, RabbitMQ, decoupling services.' },
      { id: 'sd-14', name: 'Event Driven Architecture', completed: false, resourceLink: 'https://www.geeksforgeeks.org/event-driven-architecture-system-design/', notes: '' },
      { id: 'sd-15', name: 'Microservices', completed: false, resourceLink: 'https://www.geeksforgeeks.org/microservices-architecture-system-design-pattern/', notes: '' },
      { id: 'sd-16', name: 'Monolith', completed: false, resourceLink: 'https://www.geeksforgeeks.org/monolithic-vs-microservices-architecture-system-design/', notes: '' },
      { id: 'sd-17', name: 'API Gateway', completed: false, resourceLink: 'https://www.geeksforgeeks.org/api-gateway-system-design-pattern/', notes: '' },
      { id: 'sd-18', name: 'Rate Limiting', completed: false, resourceLink: 'https://www.geeksforgeeks.org/rate-limiting-system-design-pattern/', notes: 'Algorithms: Token bucket, Leaky bucket, Sliding window logs.' },
      { id: 'sd-19', name: 'Authentication', completed: false, resourceLink: 'https://www.geeksforgeeks.org/authentication-and-authorization-system-design/', notes: '' },
      { id: 'sd-20', name: 'Authorization', completed: false, resourceLink: 'https://www.geeksforgeeks.org/role-based-access-control-rbac-system-design/', notes: 'RBAC, ABAC.' },
      { id: 'sd-21', name: 'Monitoring', completed: false, resourceLink: 'https://www.geeksforgeeks.org/monitoring-and-alerting-system-design/', notes: '' },
      { id: 'sd-22', name: 'Logging', completed: false, resourceLink: 'https://www.geeksforgeeks.org/distributed-logging-service-system-design/', notes: '' },
      { id: 'sd-23', name: 'Distributed Systems Basics', completed: false, resourceLink: 'https://www.geeksforgeeks.org/distributed-systems-tutorial/', notes: '' },
    ]
  },
  {
    id: 'sql',
    name: 'SQL',
    topics: [
      { id: 'sql-1', name: 'Topics to be added', completed: false, resourceLink: '', notes: 'This subject is a placeholder — topics will be populated later.' },
    ]
  },
  {
    id: 'probstats',
    name: 'Probability & Statistics',
    topics: [
      { id: 'ps-1', name: 'Topics to be added', completed: false, resourceLink: '', notes: 'This subject is a placeholder — topics will be populated later.' },
    ]
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    topics: [
      { id: 'ml-1', name: 'Topics to be added', completed: false, resourceLink: '', notes: 'This subject is a placeholder — topics will be populated later.' },
    ]
  },
  {
    id: 'swe',
    name: 'Software Engineering',
    topics: [
      { id: 'swe-1', name: 'Topics to be added', completed: false, resourceLink: '', notes: 'This subject is a placeholder — topics will be populated later.' },
    ]
  }
]

export const SEED_APTITUDE_TOPICS: AptitudeTopic[] = [
  // Quantitative Aptitude
  { id: 'apt-q1', name: 'Number System', completed: false, resourceLink: 'https://www.indiabix.com/quantitative-aptitude/number-system/', notes: '', category: 'Quantitative' },
  { id: 'apt-q2', name: 'Percentages', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/percentage/', notes: '', category: 'Quantitative' },
  { id: 'apt-q3', name: 'Profit & Loss', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/profit-and-loss/', notes: '', category: 'Quantitative' },
  { id: 'apt-q4', name: 'Time & Work', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/time-and-work/', notes: '', category: 'Quantitative' },
  { id: 'apt-q5', name: 'Time Speed Distance', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/time-and-distance/', notes: '', category: 'Quantitative' },
  { id: 'apt-q6', name: 'Ratio & Proportion', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/ratio-and-proportion/', notes: '', category: 'Quantitative' },
  { id: 'apt-q7', name: 'Permutations & Combinations', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/permutation-and-combination/', notes: '', category: 'Quantitative' },
  { id: 'apt-q8', name: 'Probability', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/probability/', notes: '', category: 'Quantitative' },
  { id: 'apt-q9', name: 'Geometry', completed: false, resourceLink: 'https://www.indiabix.com/quantitative-aptitude/geometry/', notes: '', category: 'Quantitative' },
  { id: 'apt-q10', name: 'Mensuration', completed: false, resourceLink: 'https://www.indiabix.com/aptitude/area/', notes: '', category: 'Quantitative' },
  { id: 'apt-q11', name: 'Algebra', completed: false, resourceLink: 'https://www.indiabix.com/quantitative-aptitude/algebra/', notes: '', category: 'Quantitative' },
  { id: 'apt-q12', name: 'Data Interpretation', completed: false, resourceLink: 'https://www.indiabix.com/data-interpretation/questions-and-answers/', notes: '', category: 'Quantitative' },

  // Logical Reasoning
  { id: 'apt-l1', name: 'Coding Decoding', completed: true, resourceLink: 'https://www.indiabix.com/verbal-reasoning/coding-decoding/', notes: 'Covered letter shifting, number coding.', category: 'Logical' },
  { id: 'apt-l2', name: 'Blood Relations', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/blood-relation-test/', notes: '', category: 'Logical' },
  { id: 'apt-l3', name: 'Direction Sense', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/direction-sense-test/', notes: '', category: 'Logical' },
  { id: 'apt-l4', name: 'Seating Arrangement', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/seating-arrangement/', notes: '', category: 'Logical' },
  { id: 'apt-l5', name: 'Puzzles', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/puzzle/', notes: '', category: 'Logical' },
  { id: 'apt-l6', name: 'Syllogism', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/syllogism/', notes: '', category: 'Logical' },
  { id: 'apt-l7', name: 'Statement & Assumption', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/statement-assumption/', notes: '', category: 'Logical' },
  { id: 'apt-l8', name: 'Statement & Conclusion', completed: false, resourceLink: 'https://www.indiabix.com/verbal-reasoning/statement-conclusion/', notes: '', category: 'Logical' },

  // Verbal Ability
  { id: 'apt-v1', name: 'Reading Comprehension', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/comprehension/', notes: '', category: 'Verbal' },
  { id: 'apt-v2', name: 'Vocabulary', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/synonyms/', notes: '', category: 'Verbal' },
  { id: 'apt-v3', name: 'Grammar', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/spotting-errors/', notes: '', category: 'Verbal' },
  { id: 'apt-v4', name: 'Sentence Correction', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/sentence-correction/', notes: '', category: 'Verbal' },
  { id: 'apt-v5', name: 'Para Jumbles', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/ordering-of-sentences/', notes: '', category: 'Verbal' },
  { id: 'apt-v6', name: 'Synonyms', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/synonyms/', notes: '', category: 'Verbal' },
  { id: 'apt-v7', name: 'Antonyms', completed: false, resourceLink: 'https://www.indiabix.com/verbal-ability/antonyms/', notes: '', category: 'Verbal' },
]

export const SEED_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'PrepTrack Dashboard',
    description: 'A production-grade SaaS-like preparation tracker for students targeting software engineering placements, built with Next.js 16 and Tailwind CSS v4.',
    status: 'Done',
    techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'LocalStorage'],
    skillsToLearn: ['UI Redesign', 'LocalStorage Syncing', 'AI Chatbot Interfaces'],
    notes: 'Includes DSA table search/sort/filter, subject checklists, projects tracking, aptitude lists, and a fixed AI assistant panel.',
    link: 'https://github.com/user/preptrack',
    githubLink: 'https://github.com/user/preptrack',
    liveDemo: 'https://preptrack-dashboard.vercel.app',
    startDate: '2026-05-15',
    endDate: '2026-06-30',
    highlight: true,
  },
  {
    id: '2',
    name: 'Distributed Task Queue',
    description: 'A robust, high-performance distributed task scheduler in Go. Replicates task execution logs and uses Redis for task persistence and queueing.',
    status: 'In Progress',
    techStack: ['Go', 'Redis', 'Docker', 'gRPC'],
    skillsToLearn: ['Distributed consensus', 'Concurrent queueing', 'Docker compose orchestration'],
    notes: 'Working on worker crash recovery, heartbeat mechanisms, and dashboard visualization.',
    link: 'https://github.com/user/task-queue',
    githubLink: 'https://github.com/user/task-queue',
    startDate: '2026-06-10',
    endDate: '',
    highlight: false,
  },
  {
    id: '3',
    name: 'E-commerce Microservices Platform',
    description: 'A scalable ecommerce suite featuring catalog, ordering, payment, and notification microservices, communicating via Apache Kafka.',
    status: 'Planned',
    techStack: ['Spring Boot', 'Kafka', 'PostgreSQL', 'Kubernetes'],
    skillsToLearn: ['Event-driven systems', 'API Gateways', 'Centralized monitoring'],
    notes: 'Planned to deploy on AWS using EKS, with Prometheus and Grafana for system monitoring.',
    link: '',
    githubLink: '',
    liveDemo: '',
    startDate: '2026-07-15',
    endDate: '',
  },
]

export const SEED_CERTIFICATIONS: Certification[] = [
  {
    id: '1',
    name: 'AWS Solutions Architect Associate',
    provider: 'Amazon Web Services',
    status: 'In Progress',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    link: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    notes: 'Focusing on VPC networks, IAM policies, S3 lifecycle rules, and EC2 auto-scaling.',
  },
  {
    id: '2',
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google Cloud Platform',
    status: 'Not Started',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    link: 'https://cloud.google.com/certification/cloud-engineer',
    notes: 'Planned to begin once AWS exam is cleared. Covered GCP CLI basics.',
  },
  {
    id: '3',
    name: 'Certified Kubernetes Administrator (CKA)',
    provider: 'The Linux Foundation',
    status: 'Completed',
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    link: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/',
    notes: 'Successfully cleared with 89% score. Learned pod schedules, networking, and cluster debug.',
    earnedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    certificateLink: 'https://credly.com/cka-verify',
  },
]

export const SEED_HR_QUESTIONS: HRQuestion[] = [
  {
    id: '1',
    question: 'Tell me about yourself',
    draftAnswer:
      'I am a software engineering student with strong computer science fundamentals, specializing in building web architectures and solving algorithmic problems. I have hands-on experience through project building (like a distributed queue in Go) and certifications...',
    source: 'Common',
    tags: ['introduction', 'general'],
  },
  {
    id: '2',
    question: 'What are your strengths and weaknesses?',
    draftAnswer:
      'Strength: Analytical problem solving and ability to quickly master new technologies. Weakness: A tendency to hyper-focus on fine details; I manage this by setting clear milestone boundaries.',
    source: 'Common',
    tags: ['personality', 'general'],
  },
]

const RAW_SEED_CONCEPTS: ConceptTopic[] = [
  // Section 1
  { id: 'concept-1-1', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Time/space complexity analysis', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-2', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Array traversal patterns — prefix sum, suffix sum', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-3', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Two pointers (opposite ends, same direction)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-4', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Sliding window (fixed size, variable size)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-5', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Binary search — standard, first/last occurrence, search on answer space', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-6', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Basic recursion — factorial, fibonacci, power function', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-1-7', sectionId: 'sec-1', sectionTitle: 'Section 1: Basics & Building Blocks', topicName: 'Bit manipulation basics — AND/OR/XOR tricks, check/set/clear bit, count set bits, power of 2 check', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 2
  { 
    id: 'concept-2-1', 
    sectionId: 'sec-2', 
    sectionTitle: 'Section 2: Sorting & Searching', 
    topicName: 'Bubble, selection, insertion sort', 
    status: 'Not Started', 
    codeSnippet: '', 
    language: 'java', 
    notes: '', 
    resourceLinks: [],
    subTopics: [
      {
        id: 'concept-2-1-1',
        name: 'Bubble Sort',
        overview: 'A simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
        notes: 'Iterate through the array n-1 times. In each iteration, swap adjacent elements if they are out of order. After the i-th pass, the i-th largest element is sorted at the end.',
        codeSnippet: `public class Main {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break; // Optimized: stop if already sorted
        }
    }

    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        for (int x : arr) System.out.print(x + " ");
    }
}`,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        pros: ['Simple to understand and implement', 'In-place sorting (no extra memory)', 'Stable sorting algorithm'],
        cons: ['Highly inefficient on large lists', 'O(N^2) average and worst-case time complexity'],
        resourceLinks: ['https://www.youtube.com/watch?v=tp8JIuCXyhw']
      },
      {
        id: 'concept-2-1-2',
        name: 'Selection Sort',
        overview: 'Selection sort divides the array into sorted and unsorted parts. It repeatedly selects the minimum element from the unsorted part and moves it to the sorted part.',
        notes: 'Find the minimum element in the unsorted subarray and swap it with the first element of that unsorted subarray. Repeat for all elements.',
        codeSnippet: `public class Main {
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }
    }

    public static void main(String[] args) {
        int[] arr = {64, 25, 12, 22, 11};
        selectionSort(arr);
        for (int x : arr) System.out.print(x + " ");
    }
}`,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        pros: ['Simple to implement', 'In-place sorting', 'Performs well on small datasets', 'Makes a maximum of O(N) swaps'],
        cons: ['O(N^2) time complexity in all cases (worst, average, best)', 'Unstable sorting algorithm'],
        resourceLinks: ['https://www.youtube.com/watch?v=tp8JIuCXyhw']
      },
      {
        id: 'concept-2-1-3',
        name: 'Insertion Sort',
        overview: 'Insertion sort works similar to sorting playing cards in our hands. The array is split into sorted and unsorted parts; values from the unsorted part are picked and placed at the correct position in the sorted part.',
        notes: 'Compare the current element key to its predecessor. If the key element is smaller than its predecessor, compare it to the elements before. Move the greater elements up one position to make space.',
        codeSnippet: `public class Main {
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; ++i) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j = j - 1;
            }
            arr[j + 1] = key;
        }
    }

    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6};
        insertionSort(arr);
        for (int x : arr) System.out.print(x + " ");
    }
}`,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        pros: ['Efficient for small datasets', 'Stable and in-place', 'Adaptive: O(N) time if array is already sorted', 'Online: can sort a list as it receives it'],
        cons: ['O(N^2) worst and average case complexity', 'Inefficient for large arrays'],
        resourceLinks: ['https://www.youtube.com/watch?v=tp8JIuCXyhw']
      }
    ]
  },
  { id: 'concept-2-2', sectionId: 'sec-2', sectionTitle: 'Section 2: Sorting & Searching', topicName: 'Merge sort', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-2-3', sectionId: 'sec-2', sectionTitle: 'Section 2: Sorting & Searching', topicName: 'Quick sort', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-2-4', sectionId: 'sec-2', sectionTitle: 'Section 2: Sorting & Searching', topicName: 'Counting sort, bucket sort', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-2-5', sectionId: 'sec-2', sectionTitle: 'Section 2: Sorting & Searching', topicName: 'Binary search on rotated sorted array', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 3
  { id: 'concept-3-1', sectionId: 'sec-3', sectionTitle: 'Section 3: Linked Lists', topicName: 'Singly linked list — insert, delete, reverse', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-3-2', sectionId: 'sec-3', sectionTitle: 'Section 3: Linked Lists', topicName: 'Doubly linked list — insert, delete', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-3-3', sectionId: 'sec-3', sectionTitle: 'Section 3: Linked Lists', topicName: "Fast & slow pointers (Floyd's cycle detection) — cycle detection, find middle, find cycle start", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { 
    id: 'concept-3-4', 
    sectionId: 'sec-3', 
    sectionTitle: 'Section 3: Linked Lists', 
    topicName: 'Reverse linked list — iterative and recursive', 
    status: 'Not Started', 
    codeSnippet: '', 
    language: 'java', 
    notes: '', 
    resourceLinks: [],
    subTopics: [
      {
        id: 'concept-3-4-1',
        name: 'Iterative Reverse LL',
        overview: 'Reverses a linked list in-place by maintaining references to the previous node, current node, and next node, and updating pointers as we traverse.',
        notes: 'Initialize three pointers: prev = null, curr = head, next = null. Loop through the list. Store the next node: next = curr.next. Reverse current node\'s pointer: curr.next = prev. Move prev and curr one step forward: prev = curr, curr = next.',
        codeSnippet: `public class Main {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        head.next.next = new ListNode(3);
        ListNode rev = reverseList(head);
        System.out.println(rev.val); // Outputs 3
    }
}`,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pros: ['Optimal space complexity O(1)', 'Highly reliable and simple in-place manipulation'],
        cons: ['Slightly harder to conceptualize pointer swaps initially'],
        resourceLinks: ['https://www.youtube.com/watch?v=D2tBIIqiUxs']
      },
      {
        id: 'concept-3-4-2',
        name: 'Recursive Reverse LL',
        overview: 'Reverses a linked list recursively. It divides the list into head and rest, recursively reverses the rest, and attaches head to the end.',
        notes: 'Base case: if head is null or next is null, return head. Recursive step: reverse the rest. Attach next.next to head, then set head.next to null.',
        codeSnippet: `public class Main {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode p = reverseList(head.next);
        head.next.next = head;
        head.next = null;
        return p;
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        ListNode rev = reverseList(head);
        System.out.println(rev.val); // Outputs 2
    }
}`,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        pros: ['Very elegant recursive code structure'],
        cons: ['Utilizes recursive call stack memory O(N), which can stack overflow for very long lists'],
        resourceLinks: ['https://www.youtube.com/watch?v=D2tBIIqiUxs']
      }
    ]
  },
  { id: 'concept-3-5', sectionId: 'sec-3', sectionTitle: 'Section 3: Linked Lists', topicName: 'Merge two sorted linked lists', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-3-6', sectionId: 'sec-3', sectionTitle: 'Section 3: Linked Lists', topicName: 'LRU Cache (linked list + hashmap)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 4
  { id: 'concept-4-1', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Stack using array/linked list', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-4-2', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Queue using array/linked list, circular queue', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-4-3', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Monotonic stack — next greater element, previous smaller element', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-4-4', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Monotonic queue — sliding window maximum', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-4-5', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Implement queue using two stacks (and vice versa)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-4-6', sectionId: 'sec-4', sectionTitle: 'Section 4: Stacks & Queues', topicName: 'Min stack (stack that tracks minimum in O(1))', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 5
  { id: 'concept-5-1', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Subsets / power set generation', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-2', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Permutations', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-3', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Combination sum', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-4', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'N-Queens', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-5', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Sudoku solver', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-6', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Rat in a maze / path-finding grids', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-5-7', sectionId: 'sec-5', sectionTitle: 'Section 5: Recursion & Backtracking', topicName: 'Word search (backtracking on grid)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 6
  { id: 'concept-6-1', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Binary tree traversals — inorder, preorder, postorder (recursive AND iterative)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-2', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Level order traversal (BFS on tree)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-3', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Height, diameter, balanced check', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-4', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Lowest Common Ancestor (LCA)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-5', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Binary Search Tree — insert, delete, search, validate BST', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-6', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Serialize/deserialize a binary tree', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-6-7', sectionId: 'sec-6', sectionTitle: 'Section 6: Trees', topicName: 'Trie (prefix tree) — insert, search, startsWith', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 7
  { id: 'concept-7-1', sectionId: 'sec-7', sectionTitle: 'Section 7: Heaps / Priority Queues', topicName: 'Build a min-heap / max-heap from scratch', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-7-2', sectionId: 'sec-7', sectionTitle: 'Section 7: Heaps / Priority Queues', topicName: 'Heapify', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-7-3', sectionId: 'sec-7', sectionTitle: 'Section 7: Heaps / Priority Queues', topicName: 'Kth largest/smallest element', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-7-4', sectionId: 'sec-7', sectionTitle: 'Section 7: Heaps / Priority Queues', topicName: 'Merge K sorted lists (heap-based)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-7-5', sectionId: 'sec-7', sectionTitle: 'Section 7: Heaps / Priority Queues', topicName: 'Top K frequent elements', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 8
  { id: 'concept-8-1', sectionId: 'sec-8', sectionTitle: 'Section 8: Graphs — Traversal', topicName: 'Graph representation — adjacency list vs matrix', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-8-2', sectionId: 'sec-8', sectionTitle: 'Section 8: Graphs — Traversal', topicName: 'BFS', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-8-3', sectionId: 'sec-8', sectionTitle: 'Section 8: Graphs — Traversal', topicName: 'DFS', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-8-4', sectionId: 'sec-8', sectionTitle: 'Section 8: Graphs — Traversal', topicName: 'Connected components', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-8-5', sectionId: 'sec-8', sectionTitle: 'Section 8: Graphs — Traversal', topicName: "Cycle detection — undirected graph (DSU or DFS), directed graph (DFS with recursion stack / colors)", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 9
  { id: 'concept-9-1', sectionId: 'sec-9', sectionTitle: 'Section 9: Graphs — Union-Find (DSU)', topicName: 'Disjoint Set Union — find, union by rank/size, path compression', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-9-2', sectionId: 'sec-9', sectionTitle: 'Section 9: Graphs — Union-Find (DSU)', topicName: 'Number of connected components', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-9-3', sectionId: 'sec-9', sectionTitle: 'Section 9: Graphs — Union-Find (DSU)', topicName: "Kruskal's MST", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-9-4', sectionId: 'sec-9', sectionTitle: 'Section 9: Graphs — Union-Find (DSU)', topicName: 'Redundant connection / cycle detection using DSU', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 10
  { id: 'concept-10-1', sectionId: 'sec-10', sectionTitle: 'Section 10: Graphs — Shortest Path & Ordering', topicName: "Topological Sort — Kahn's algorithm (BFS-based) and DFS-based", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-10-2', sectionId: 'sec-10', sectionTitle: 'Section 10: Graphs — Shortest Path & Ordering', topicName: "Dijkstra's algorithm (priority-queue based)", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-10-3', sectionId: 'sec-10', sectionTitle: 'Section 10: Graphs — Shortest Path & Ordering', topicName: 'Bellman-Ford', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-10-4', sectionId: 'sec-10', sectionTitle: 'Section 10: Graphs — Shortest Path & Ordering', topicName: 'Floyd-Warshall', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-10-5', sectionId: 'sec-10', sectionTitle: 'Section 10: Graphs — Shortest Path & Ordering', topicName: "Prim's MST", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 11
  { id: 'concept-11-1', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: "1D DP — climbing stairs, house robber, Kadane's algorithm (max subarray)", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-2', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: '2D DP — unique paths, minimum path sum', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-3', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: 'Knapsack family — 0/1 knapsack, unbounded knapsack, subset sum, partition equal subset sum', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-4', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: 'String DP — longest common subsequence (LCS), longest palindromic substring, edit distance', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-5', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: 'DP on grids — matrix chain multiplication', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-6', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: 'DP with bitmasking', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-11-7', sectionId: 'sec-11', sectionTitle: 'Section 11: Dynamic Programming', topicName: 'DP on trees', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 12
  { id: 'concept-12-1', sectionId: 'sec-12', sectionTitle: 'Section 12: Greedy Algorithms', topicName: 'Activity selection / interval scheduling', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-12-2', sectionId: 'sec-12', sectionTitle: 'Section 12: Greedy Algorithms', topicName: 'Merge intervals', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-12-3', sectionId: 'sec-12', sectionTitle: 'Section 12: Greedy Algorithms', topicName: 'Jump game', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-12-4', sectionId: 'sec-12', sectionTitle: 'Section 12: Greedy Algorithms', topicName: 'Gas station problem', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-12-5', sectionId: 'sec-12', sectionTitle: 'Section 12: Greedy Algorithms', topicName: 'Huffman encoding', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 13
  { id: 'concept-13-1', sectionId: 'sec-13', sectionTitle: 'Section 13: String Algorithms', topicName: 'String hashing basics', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-13-2', sectionId: 'sec-13', sectionTitle: 'Section 13: String Algorithms', topicName: 'KMP algorithm (pattern matching)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-13-3', sectionId: 'sec-13', sectionTitle: 'Section 13: String Algorithms', topicName: 'Rabin-Karp (rolling hash)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-13-4', sectionId: 'sec-13', sectionTitle: 'Section 13: String Algorithms', topicName: 'Z-algorithm', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-13-5', sectionId: 'sec-13', sectionTitle: 'Section 13: String Algorithms', topicName: "Manacher's algorithm", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 14
  { id: 'concept-14-1', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: "Kadane's algorithm (max subarray sum)", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-14-2', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: "Moore's Voting Algorithm (majority element)", status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-14-3', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: 'Dutch National Flag algorithm', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-14-4', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: 'Sieve of Eratosthenes', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-14-5', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: 'GCD/LCM — Euclidean algorithm', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-14-6', sectionId: 'sec-14', sectionTitle: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms', topicName: 'Fast exponentiation', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },

  // Section 15
  { id: 'concept-15-1', sectionId: 'sec-15', sectionTitle: 'Section 15: Advanced / Nice-to-Have', topicName: 'Segment Tree — range sum/min/max query, point update', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-15-2', sectionId: 'sec-15', sectionTitle: 'Section 15: Advanced / Nice-to-Have', topicName: 'Fenwick Tree / Binary Indexed Tree (BIT)', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-15-3', sectionId: 'sec-15', sectionTitle: 'Section 15: Advanced / Nice-to-Have', topicName: 'Trie applications — word break, auto-suggestions', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-15-4', sectionId: 'sec-15', sectionTitle: 'Section 15: Advanced / Nice-to-Have', topicName: 'Union-Find with union by size + path compression', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
  { id: 'concept-15-5', sectionId: 'sec-15', sectionTitle: 'Section 15: Advanced / Nice-to-Have', topicName: 'Basic graph coloring / bipartite check', status: 'Not Started', codeSnippet: '', language: 'python', notes: '', resourceLinks: [] },
];

const CONCEPT_VIDEOS_MAP: Record<string, string[]> = {
  'concept-1-1': ['https://www.youtube.com/watch?v=V42FMbUXZ7A'], // Time Complexity (Striver)
  'concept-1-2': ['https://www.youtube.com/watch?v=cMqRz4I2b_4'], // Prefix/Suffix Sum
  'concept-1-3': ['https://www.youtube.com/watch?v=2wB1UCJmPls'], // Two Pointers
  'concept-1-4': ['https://www.youtube.com/watch?v=GcW413nrh04'], // Sliding Window
  'concept-1-5': ['https://www.youtube.com/watch?v=C2apEw9pgtw', 'https://www.youtube.com/watch?v=s4D1gLnhuaA'], // Binary Search
  'concept-1-6': ['https://www.youtube.com/watch?v=yVdKa8dnKiE'], // Basic Recursion
  'concept-1-7': ['https://www.youtube.com/watch?v=5yuB36h6s5M'], // Bit Manipulation
  // Sorting
  'concept-2-1': ['https://www.youtube.com/watch?v=wN0x9eM_a8g'], // Sorting
  'concept-2-2': ['https://www.youtube.com/watch?v=ogze8Q3J1C4'], // Merge Sort
  'concept-2-3': ['https://www.youtube.com/watch?v=3PvDF15f080'], // Quick Sort
  'concept-2-4': ['https://www.youtube.com/watch?v=pEJiGC-ObQE'], // Counting / Bucket
  'concept-2-5': ['https://www.youtube.com/watch?v=oT05CX0li8E'], // Rotated Binary Search
  // Linked Lists
  'concept-3-1': ['https://www.youtube.com/watch?v=q575nL1grt8'], // Singly Linked List
  'concept-3-2': ['https://www.youtube.com/watch?v=081_J4vQp2g'], // Doubly Linked List
  'concept-3-3': ['https://www.youtube.com/watch?v=2Kd0KKoN75I'], // Fast & slow pointer
  'concept-3-4': ['https://www.youtube.com/watch?v=D2tBIIqiUxs', 'https://www.youtube.com/watch?v=yVdKa8dnKiE'], // Reverse LL
  'concept-3-5': ['https://www.youtube.com/watch?v=Xb4sra3VXY0'], // Merge sorted lists
  'concept-3-6': ['https://www.youtube.com/watch?v=xDEuM5qa0zg'], // LRU Cache
  // Stacks & Queues
  'concept-4-1': ['https://www.youtube.com/watch?v=GYptUgnIM_I'], // Stack using Array/LL
  'concept-4-2': ['https://www.youtube.com/watch?v=mDCiGMrqyWY'], // Queue using Array/LL
  'concept-4-3': ['https://www.youtube.com/watch?v=rOcQLKGAdxo'], // Monotonic Stack
  'concept-4-4': ['https://www.youtube.com/watch?v=DfljaUwZsOk'], // Monotonic Queue
  'concept-4-5': ['https://www.youtube.com/watch?v=3Et9kqQk1kI'], // Queue using Stacks
  'concept-4-6': ['https://www.youtube.com/watch?v=asf9P2Rcopo'], // Min Stack
  // Recursion & Backtracking
  'concept-5-1': ['https://www.youtube.com/watch?v=b7AYbpM5YrE'], // Power Set
  'concept-5-2': ['https://www.youtube.com/watch?v=KukNnoN-SoY'], // Permutations
  'concept-5-3': ['https://www.youtube.com/watch?v=oy018vS5sO4'], // Combination Sum
  'concept-5-4': ['https://www.youtube.com/watch?v=i05Ju7AFTcM'], // N-Queens
  'concept-5-5': ['https://www.youtube.com/watch?v=FWAIf_yONkE'], // Sudoku solver
  'concept-5-6': ['https://www.youtube.com/watch?v=bLGZHJ116fc'], // Rat in a Maze
  'concept-5-7': ['https://www.youtube.com/watch?v=m9trUMg22U0'], // Word Search
  // Trees
  'concept-6-1': ['https://www.youtube.com/watch?v=jmy0La5M1uo'], // Traversals
  'concept-6-2': ['https://www.youtube.com/watch?v=EoAsWbO7sqg'], // BFS Tree
  'concept-6-3': ['https://www.youtube.com/watch?v=eD3tmO66aSE'], // Height / Diameter
  'concept-6-4': ['https://www.youtube.com/watch?v=_-QHfMDHN9w'], // LCA
  'concept-6-5': ['https://www.youtube.com/watch?v=p7-9UvDQF38'], // BST Operations
  'concept-6-6': ['https://www.youtube.com/watch?v=-YbYLibAMmY'], // Serialize Tree
  'concept-6-7': ['https://www.youtube.com/watch?v=dBGUmUQhJaM'], // Trie
  // Heaps
  'concept-7-1': ['https://www.youtube.com/watch?v=HqPJF2L5h9U'], // Heaps from Scratch
  'concept-7-2': ['https://www.youtube.com/watch?v=UVW0NfG_YTA'], // Heapify
  'concept-7-3': ['https://www.youtube.com/watch?v=aXJ1ybMxqy0'], // Kth element
  'concept-7-4': ['https://www.youtube.com/watch?v=kpCesr9VXDA'], // Merge K lists
  'concept-7-5': ['https://www.youtube.com/watch?v=7MqpR2PlUeg'], // Top K frequent
  // Graphs Traversal
  'concept-8-1': ['https://www.youtube.com/watch?v=b576gQnQv_c'], // Representation
  'concept-8-2': ['https://www.youtube.com/watch?v=-tgVpUQsIb8'], // BFS Graph
  'concept-8-3': ['https://www.youtube.com/watch?v=uDwSnjErfF4'], // DFS Graph
  'concept-8-4': ['https://www.youtube.com/watch?v=C7U2vBgdAig'], // Connected Components
  'concept-8-5': ['https://www.youtube.com/watch?v=vXrv3GVVYMc'], // Cycle detection Graph
  // Union Find
  'concept-9-1': ['https://www.youtube.com/watch?v=aBxjDBCClM8'], // DSU find & union
  'concept-9-2': ['https://www.youtube.com/watch?v=C7U2vBgdAig'], // Count components
  'concept-9-3': ['https://www.youtube.com/watch?v=DMnDM_sxVig'], // Kruskal's MST
  'concept-9-4': ['https://www.youtube.com/watch?v=vXrv3GVVYMc'], // Cycle using DSU
  // Shortest Path
  'concept-10-1': ['https://www.youtube.com/watch?v=5lZ0iJpKnf0'], // Topological Sort
  'concept-10-2': ['https://www.youtube.com/watch?v=V6H1qAeB-l4'], // Dijkstra
  'concept-10-3': ['https://www.youtube.com/watch?v=0vVofahBgdY'], // Bellman-Ford
  'concept-10-4': ['https://www.youtube.com/watch?v=YbY8A-_DwTk'], // Floyd-Warshall
  'concept-10-5': ['https://www.youtube.com/watch?v=mJcZGoF40e4'], // Prim's MST
  // DP
  'concept-11-1': ['https://www.youtube.com/watch?v=tyB0ySGQ3v4', 'https://www.youtube.com/watch?v=w_KEocd__20'], // 1D DP
  'concept-11-2': ['https://www.youtube.com/watch?v=rbaC9ae2j04'], // 2D DP Grids
  'concept-11-3': ['https://www.youtube.com/watch?v=GqHpGjCHtW0'], // Knapsack family
  'concept-11-4': ['https://www.youtube.com/watch?v=NPvvyxb-TIE'], // LCS String DP
  'concept-11-5': ['https://www.youtube.com/watch?v=v5jK1aU_w8A'], // MCM Matrix
  'concept-11-6': ['https://www.youtube.com/watch?v=Je30EKYNLfM'], // DP Bitmasking
  'concept-11-7': ['https://www.youtube.com/watch?v=zfiTAd36w08'], // DP on Trees
  // Greedy
  'concept-12-1': ['https://www.youtube.com/watch?v=II6ziN031j4'], // Activity selection
  'concept-12-2': ['https://www.youtube.com/watch?v=2JzRBPFYbKE'], // Merge intervals
  'concept-12-3': ['https://www.youtube.com/watch?v=tZAa_jWRF9Y'], // Jump game
  'concept-12-4': ['https://www.youtube.com/watch?v=XM6w4723t2c'], // Gas station
  'concept-12-5': ['https://www.youtube.com/watch?v=co4_ahEdCho'], // Huffman encoding
  // Strings
  'concept-13-1': ['https://www.youtube.com/watch?v=m4m8aG-b15E'], // Hashing
  'concept-13-2': ['https://www.youtube.com/watch?v=V5-7GzOfADQ', 'https://www.youtube.com/watch?v=qQ8vS_n50U4'], // KMP
  'concept-13-3': ['https://www.youtube.com/watch?v=qQ8vS_n50U4'], // Rabin Karp
  'concept-13-4': ['https://www.youtube.com/watch?v=CpZh4eF8QBw'], // Z algorithm
  'concept-13-5': ['https://www.youtube.com/watch?v=V-sEwsca1ak'], // Manacher
  // Specific
  'concept-14-1': ['https://www.youtube.com/watch?v=w_KEocd__20'], // Kadane
  'concept-14-2': ['https://www.youtube.com/watch?v=n5AL05CybZ4'], // Moore's Voting
  'concept-14-3': ['https://www.youtube.com/watch?v=tp8JIuCXyhw'], // Dutch National Flag
  'concept-14-4': ['https://www.youtube.com/watch?v=g5FUXiWliBM'], // Sieve
  'concept-14-5': ['https://www.youtube.com/watch?v=11cE4zQp4oM'], // GCD/Euclidean
  'concept-14-6': ['https://www.youtube.com/watch?v=L-Wzglnm4dM'], // Binary Exponentiation
  // Advanced
  'concept-15-1': ['https://www.youtube.com/watch?v=2FShdqn-C80'], // Segment Tree
  'concept-15-2': ['https://www.youtube.com/watch?v=CWDQJGaN1gY'], // Fenwick Tree
  'concept-15-3': ['https://www.youtube.com/watch?v=dBGUmUQhJaM'], // Trie Applications
  'concept-15-4': ['https://www.youtube.com/watch?v=aBxjDBCClM8'], // Union-Find Revisit
  'concept-15-5': ['https://www.youtube.com/watch?v=052VkKhZOyQ']  // Bipartite Check Graph coloring
};

export const SEED_CONCEPTS: ConceptTopic[] = RAW_SEED_CONCEPTS.map(concept => ({
  ...concept,
  language: 'java',
  resourceLinks: CONCEPT_VIDEOS_MAP[concept.id] || []
}));
