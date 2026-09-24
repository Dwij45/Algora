import type { RunnableLanguage } from "./languages";

const ENTRY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertEntryName(entryName: string): string {
  if (!ENTRY_RE.test(entryName)) throw new Error("Invalid harness entry name.");
  return entryName;
}

export type PreparedSubmission = {
  source: string;
  stdin: string;
};

/**
 * Glue around the learner's function/class. Python/JS read JSON stdin.
 * Java/C++ cannot bind LeetCode-style `vector<int>&` from stdin easily, so we
 * inject literals we generated (catalog data, not user data).
 */
export function prepareSubmission(opts: {
  language: RunnableLanguage;
  source: string;
  entryName: string;
  stdinJson: string;
}): PreparedSubmission {
  const entry = assertEntryName(opts.entryName);
  const user = opts.source.trim();
  if (!user) throw new Error("Source is empty.");

  if (opts.language === "python") {
    return {
      stdin: opts.stdinJson,
      source: `import json, sys
${user}
_fn = globals().get(${JSON.stringify(entry)})
if not callable(_fn):
    raise SystemExit("Missing function ${entry}")
_args = json.loads(sys.stdin.read())
if not isinstance(_args, list):
    _args = [_args]
_res = _fn(*_args)
print(json.dumps(_res))
`,
    };
  }

  if (opts.language === "javascript") {
    return {
      stdin: opts.stdinJson,
      source: `const stdin = require("fs").readFileSync(0, "utf8");
${user}
if (typeof ${entry} !== "function") {
  console.error("Missing function ${entry}");
  process.exit(1);
}
let args = JSON.parse(stdin);
if (!Array.isArray(args)) args = [args];
const result = ${entry}(...args);
if (typeof result === "undefined") {
  console.error("Function returned undefined");
  process.exit(1);
}
console.log(JSON.stringify(result));
`,
    };
  }

  const args = parseArgList(opts.stdinJson);

  // for Java runner: inject public class Main; tests become Java locals (stdin unused)
  if (opts.language === "java") {
    if (/\bclass\s+Main\b/.test(user)) {
      throw new Error("Remove class Main — wrap with class Solution only.");
    }
    const decls = args.map((arg, i) => javaDecl(arg, `a${i}`)).join("\n        ");
    const callArgs = args.map((_, i) => `a${i}`).join(", ");
    return {
      stdin: "",
      source: `${user}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        ${decls}
        System.out.println(toJson(sol.${entry}(${callArgs})));
    }
    static String toJson(int x) { return Integer.toString(x); }
    static String toJson(long x) { return Long.toString(x); }
    static String toJson(double x) {
        if (x == (long) x) return Long.toString((long) x);
        return Double.toString(x);
    }
    static String toJson(boolean x) { return x ? "true" : "false"; }
    static String toJson(String x) {
        if (x == null) return "null";
        StringBuilder sb = new StringBuilder("\\"");
        for (int i = 0; i < x.length(); i++) {
            char c = x.charAt(i);
            if (c == '\\\\' || c == '"') sb.append('\\\\');
            sb.append(c);
        }
        return sb.append("\\"").toString();
    }
    static String toJson(int[] x) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < x.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(x[i]);
        }
        return sb.append("]").toString();
    }
    static String toJson(boolean[] x) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < x.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(x[i] ? "true" : "false");
        }
        return sb.append("]").toString();
    }
}
`,
    };
  }

  // for C++: inject Solution + main(); tests become C++ literals (stdin is unused)
  if (/\bint\s+main\s*\(/.test(user)) {
    throw new Error("Remove main() — wrap with class Solution only.");
  }
  const cppDecls = args.map((arg, i) => cppDecl(arg, `a${i}`)).join("\n  ");
  const cppCall = args.map((_, i) => `a${i}`).join(", ");
  return {
    stdin: "",
    source: `#include <bits/stdc++.h>
using namespace std;

${user}

void printJson(int x) { cout << x; }
void printJson(long long x) { cout << x; }
void printJson(double x) { cout << x; }
void printJson(bool x) { cout << (x ? "true" : "false"); }
void printJson(const string& x) {
  cout << '"';
  for (char c : x) {
    if (c == '\\\\' || c == '"') cout << '\\\\';
    cout << c;
  }
  cout << '"';
}
template <class T>
void printJson(const vector<T>& v) {
  cout << '[';
  for (size_t i = 0; i < v.size(); i++) {
    if (i) cout << ',';
    printJson(v[i]);
  }
  cout << ']';
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  Solution sol;
  ${cppDecls}
  printJson(sol.${entry}(${cppCall}));
  cout << endl;
  return 0;
}
`,
  };
}

function parseArgList(stdinJson: string): unknown[] {
  const parsed = JSON.parse(stdinJson) as unknown;
  return Array.isArray(parsed) ? parsed : [parsed];
}

// for Java runner: turn a JSON test arg into a local variable
  // for Java runner: turn a JSON test arg into a local variable
  function javaDecl(value: unknown, name: string): string {
  if (typeof value === "number") {
    if (Number.isInteger(value)) return `int ${name} = ${value};`;
    return `double ${name} = ${value};`;
  }
  if (typeof value === "boolean") return `boolean ${name} = ${value};`;
  if (typeof value === "string") return `String ${name} = ${javaString(value)};`;
  if (Array.isArray(value) && value.every((x) => typeof x === "number" && Number.isInteger(x))) {
    return `int[] ${name} = new int[]{${value.join(",")}};`;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
    return `String[] ${name} = new String[]{${value.map((x) => javaString(x)).join(",")}};`;
  }
  throw new Error("This test shape is not supported in the Java harness yet.");
}

// for C++: turn a JSON test arg into a local variable
function cppDecl(value: unknown, name: string): string {
  if (typeof value === "number") {
    if (Number.isInteger(value)) return `int ${name} = ${value};`;
    return `double ${name} = ${value};`;
  }
  if (typeof value === "boolean") return `bool ${name} = ${value ? "true" : "false"};`;
  if (typeof value === "string") return `string ${name} = ${cppString(value)};`;
  if (Array.isArray(value) && value.every((x) => typeof x === "number" && Number.isInteger(x))) {
    const inner = value.length ? value.join(",") : "";
    return `vector<int> ${name} = {${inner}};`;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
    return `vector<string> ${name} = {${value.map((x) => cppString(x)).join(",")}};`;
  }
  throw new Error("This test shape is not supported in the C++ harness yet.");
}

// for Java runner: JSON string as a Java string literal
function javaString(value: string): string {
  return JSON.stringify(value);
}

// for C++: JSON string as a C++ string literal
function cppString(value: string): string {
  return JSON.stringify(value);
}
