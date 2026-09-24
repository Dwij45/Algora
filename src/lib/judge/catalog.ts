export type CatalogCase = {
  visibility: "sample" | "hidden";
  stdin: string;
  expectedStdout: string;
  explanation?: string;
};

export type CatalogProblem = {
  entryName: string;
  compareMode: "json" | "json_any_order" | "exact";
  starters: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  cases: CatalogCase[];
};

function args(value: unknown): string {
  return JSON.stringify(value);
}

function out(value: unknown): string {
  return JSON.stringify(value);
}

function py(name: string, hint: string, extra = ""): string {
  return `def ${name}(${hint}):
    ${extra || "pass"}
`;
}

function js(name: string, hint: string): string {
  return `function ${name}(${hint}) {
  // return the answer
}
`;
}

function java(sig: string): string {
  return `class Solution {
    public ${sig} {
        // return the answer
    }
}
`;
}

function cpp(sig: string): string {
  return `class Solution {
public:
    ${sig} {
        // return the answer
    }
};
`;
}

/** Hand-authored tests. Hidden cases never go to the client. */
export const JUDGE_CATALOG: Record<string, CatalogProblem> = {
  "two-sum": {
    entryName: "twoSum",
    compareMode: "json_any_order",
    starters: {
      python: py("twoSum", "nums, target"),
      javascript: js("twoSum", "nums, target"),
      java: java("int[] twoSum(int[] nums, int target)"),
      cpp: cpp("vector<int> twoSum(vector<int>& nums, int target)"),
    },
    cases: [
      {
        visibility: "sample",
        stdin: args([[2, 7, 11, 15], 9]),
        expectedStdout: out([0, 1]),
        explanation: "2 + 7 = 9",
      },
      {
        visibility: "sample",
        stdin: args([[3, 2, 4], 6]),
        expectedStdout: out([1, 2]),
      },
      {
        visibility: "sample",
        stdin: args([[3, 3], 6]),
        expectedStdout: out([0, 1]),
      },
      { visibility: "hidden", stdin: args([[1, 5, 3, 7], 8]), expectedStdout: out([0, 3]) },
      { visibility: "hidden", stdin: args([[0, 4, 3, 0], 0]), expectedStdout: out([0, 3]) },
      { visibility: "hidden", stdin: args([[-1, -2, -3, -4, -5], -8]), expectedStdout: out([2, 4]) },
    ],
  },
  "valid-parentheses": {
    entryName: "isValid",
    compareMode: "json",
    starters: {
      python: py("isValid", "s"),
      javascript: js("isValid", "s"),
      java: java("boolean isValid(String s)"),
      cpp: cpp("bool isValid(string s)"),
    },
    cases: [
      { visibility: "sample", stdin: args(["()"]), expectedStdout: out(true) },
      { visibility: "sample", stdin: args(["()[]{}"]), expectedStdout: out(true) },
      { visibility: "sample", stdin: args(["(]"]), expectedStdout: out(false) },
      { visibility: "hidden", stdin: args(["([)]"]), expectedStdout: out(false) },
      { visibility: "hidden", stdin: args(["{[]}"]), expectedStdout: out(true) },
      { visibility: "hidden", stdin: args([""]), expectedStdout: out(true) },
    ],
  },
  "contains-duplicate": {
    entryName: "containsDuplicate",
    compareMode: "json",
    starters: {
      python: py("containsDuplicate", "nums"),
      javascript: js("containsDuplicate", "nums"),
      java: java("boolean containsDuplicate(int[] nums)"),
      cpp: cpp("bool containsDuplicate(vector<int>& nums)"),
    },
    cases: [
      { visibility: "sample", stdin: args([[1, 2, 3, 1]]), expectedStdout: out(true) },
      { visibility: "sample", stdin: args([[1, 2, 3, 4]]), expectedStdout: out(false) },
      { visibility: "sample", stdin: args([[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]]), expectedStdout: out(true) },
      { visibility: "hidden", stdin: args([[]]), expectedStdout: out(false) },
      { visibility: "hidden", stdin: args([[7]]), expectedStdout: out(false) },
    ],
  },
  "palindrome-number": {
    entryName: "isPalindrome",
    compareMode: "json",
    starters: {
      python: py("isPalindrome", "x"),
      javascript: js("isPalindrome", "x"),
      java: java("boolean isPalindrome(int x)"),
      cpp: cpp("bool isPalindrome(int x)"),
    },
    cases: [
      { visibility: "sample", stdin: args([121]), expectedStdout: out(true) },
      { visibility: "sample", stdin: args([-121]), expectedStdout: out(false) },
      { visibility: "sample", stdin: args([10]), expectedStdout: out(false) },
      { visibility: "hidden", stdin: args([0]), expectedStdout: out(true) },
      { visibility: "hidden", stdin: args([12321]), expectedStdout: out(true) },
    ],
  },
  "best-time-to-buy-and-sell-stock": {
    entryName: "maxProfit",
    compareMode: "json",
    starters: {
      python: py("maxProfit", "prices"),
      javascript: js("maxProfit", "prices"),
      java: java("int maxProfit(int[] prices)"),
      cpp: cpp("int maxProfit(vector<int>& prices)"),
    },
    cases: [
      { visibility: "sample", stdin: args([[7, 1, 5, 3, 6, 4]]), expectedStdout: out(5) },
      { visibility: "sample", stdin: args([[7, 6, 4, 3, 1]]), expectedStdout: out(0) },
      { visibility: "hidden", stdin: args([[2, 4, 1]]), expectedStdout: out(2) },
      { visibility: "hidden", stdin: args([[1]]), expectedStdout: out(0) },
    ],
  },
};
