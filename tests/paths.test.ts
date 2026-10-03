import assert from "node:assert/strict";
import test from "node:test";
import { withBase, withBaseAttributes } from "../src/lib/paths.ts";

test("internal routes and assets work at the root and under a project base", () => {
  assert.equal(withBase("/", "/"), "/");
  assert.equal(withBase("/brand/", "/web-design-system/"), "/web-design-system/brand/");
  assert.equal(withBase("/brand/favicons/favicon-32.png", "/web-design-system"), "/web-design-system/brand/favicons/favicon-32.png");
  assert.throws(() => withBase("https://example.invalid", "/"));
  assert.throws(() => withBase("//example.invalid", "/"));
});

test("specimens resolve both quote styles without changing external links or anchors", () => {
  assert.equal(
    withBaseAttributes(`<img src='/brand/providers/google-g-logo.png'><a href="/brand/">Brand</a>`, "/web-design-system/"),
    `<img src='/web-design-system/brand/providers/google-g-logo.png'><a href="/web-design-system/brand/">Brand</a>`,
  );
  const external = `<a href="https://example.invalid/">External</a><a href="#sample">Sample</a><img src="//example.invalid/mark.png">`;
  assert.equal(withBaseAttributes(external, "/web-design-system/"), external);
});
