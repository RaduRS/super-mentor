import axios from "axios";

type BookSearchParams = {
  query: string;
  limit?: number;
};

function compact(text: unknown) {
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

export async function searchBooks(params: BookSearchParams) {
  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(20, params.limit)) : 10;

  const openLibrary = await axios.get("https://openlibrary.org/search.json", {
    params: {
      q: params.query,
      limit,
    },
  });

  const data: unknown = openLibrary.data;
  if (!data || typeof data !== "object" || !("docs" in data)) {
    throw new Error("Unexpected Open Library response");
  }

  const docs = (data as { docs?: unknown }).docs;
  if (!Array.isArray(docs)) return [];

  return docs.slice(0, limit).map((d) => {
    const doc = d as Record<string, unknown>;
    const title = compact(doc.title);
    const authorName = Array.isArray(doc.author_name) ? doc.author_name[0] : null;
    const author = compact(authorName);
    const firstPublishYear =
      typeof doc.first_publish_year === "number" ? doc.first_publish_year : null;
    const key = compact(doc.key);
    const coverI = typeof doc.cover_i === "number" ? doc.cover_i : null;

    return {
      source: "openlibrary" as const,
      key,
      title,
      author,
      firstPublishYear,
      coverUrl: coverI ? `https://covers.openlibrary.org/b/id/${coverI}-M.jpg` : null,
    };
  });
}

