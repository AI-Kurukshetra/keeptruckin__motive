import { ZodSchema } from "zod";

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json().catch(() => null);
  return schema.safeParse(body);
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}
