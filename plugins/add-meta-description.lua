-- Moves a page excerpt into the document head as its search description.

local excerpts = HTML.select(page, "p#excerpt")
if Table.length(excerpts) > 1 then
  Plugin.fail("Found more than one excerpt; each page can define at most one p#excerpt")
end

local excerpt = excerpts[1]
if excerpt == nil then
  Plugin.exit("No excerpt defined, nothing to do")
end

local description_text = Regex.replace(String.trim(HTML.strip_tags(excerpt)), "\\s+", " ")
local description = HTML.create_element("meta")
HTML.set_attribute(description, "name", "description")
HTML.set_attribute(description, "content", description_text)
HTML.append_child(HTML.select_one(page, "head"), description)
HTML.delete(excerpt)
