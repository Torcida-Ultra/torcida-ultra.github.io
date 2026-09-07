-- Moves the canonical declaration from page content into the document head.

local canonical_links = HTML.select(page, "link[rel=\"canonical\"]")
if Table.length(canonical_links) > 1 then
  Plugin.fail("Found more than one canonical link; each page can define at most one")
end

local canonical_link = canonical_links[1]
if canonical_link == nil then
  Plugin.exit("No canonical link defined, nothing to do")
end

HTML.append_child(HTML.select_one(page, "head"), canonical_link)
