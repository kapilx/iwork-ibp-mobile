export const getTextFromHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const text = doc.body.textContent || doc.body.innerText;
  return text;
};

export const isHtmlEmpty = (html?: string | null): boolean => {
  if (!html) return true;

  // Create a detached DOM node and grab its innerText
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.innerText.replace(/\u00A0/g, "").trim(); // strip nbsp + whitespace
  return text.length === 0;
};

export const normalizeEmptyParagraphs = (html: string): string =>
  html.replace(/(?:<p><br\s*\/?><\/p>\s*)+/gi, "<p><br></p>");

export const validateRichTextLimit = (
  value: string,
  limit: number,
  errorMessage: string
): true | string => {
  const plainText = getTextFromHtml(value || "");
  return plainText.length <= limit ? true : errorMessage;
};
