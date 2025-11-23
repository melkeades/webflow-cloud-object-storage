import type { APIRoute } from "astro";
import { API } from "../../utils/api";

export const GET: APIRoute = async ({ locals, request }) => {
  API.init((locals.runtime as any).env.ORIGIN);

  try {
    const bucket = locals.runtime.env.CLOUD_FILES;
    if (!bucket) {
      return API.error("Cloud storage not configured", request, 500);
    }

    const options = { limit: 500 };
    const listed = await bucket.list(options);
    let truncated = listed.truncated;

    // Paging through the files
    // @ts-ignore
    let cursor = truncated ? listed.cursor : undefined;

    while (truncated) {
      const next = await bucket.list({
        ...options,
        cursor: cursor,
      });
      listed.objects.push(...next.objects);

      truncated = next.truncated;
      // @ts-ignore
      cursor = next.cursor;
    }

    return API.json(listed.objects, request);
  } catch (error) {
    console.error("Error listing assets:", error);
    return API.error("Failed to list assets", request, 500);
  }
};

export const OPTIONS: APIRoute = async ({ request, locals }) => {
  API.init((locals.runtime as any).env.ORIGIN);
  return API.cors(request);
};
