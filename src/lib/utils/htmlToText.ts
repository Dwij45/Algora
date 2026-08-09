/** Strip HTML from LeetCode problem content into readable plain text. */
export function htmlToText(html: string): string {
  if (!html) return "";

  let text = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, "\n\n")
    .replace(/<\s*pre[^>]*>/gi, "\n")
    .replace(/<\s*\/\s*pre\s*>/gi, "\n")
    .replace(/<\s*code[^>]*>/gi, "")
    .replace(/<\s*\/\s*code\s*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
