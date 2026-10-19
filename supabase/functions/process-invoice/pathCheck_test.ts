import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isOwnInvoicePath } from "./pathCheck.ts";
const me = "11111111-1111-1111-1111-111111111111";
Deno.test("own invoice path allowed", () => assertEquals(isOwnInvoicePath(`${me}/123.pdf`, me), true));
Deno.test("other user's invoice rejected", () => assertEquals(isOwnInvoicePath("22222222-2222-2222-2222-222222222222/1.pdf", me), false));
Deno.test("traversal rejected", () => assertEquals(isOwnInvoicePath(`${me}/../x/1.pdf`, me), false));
Deno.test("non-string rejected", () => assertEquals(isOwnInvoicePath(null, me), false));
