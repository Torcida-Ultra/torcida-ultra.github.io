-- Derives social-card metadata from the canonical search metadata.

Plugin.require_version("4.0.0")

function require_one(selector, label)
  local elements = HTML.select(page, selector)
  if Table.length(elements) ~= 1 then
    Plugin.fail(format("Expected exactly one %s before generating social metadata", label))
  end
  return elements[1]
end

function require_custom_option(name)
  local options = soupault_config["custom_options"]
  if not Table.has_key(options, name) then
    Plugin.fail(format([[custom_options["%s"] is required for social metadata]], name))
  end
  return options[name]
end

local head = require_one("head", "head element")
local title = String.trim(HTML.strip_tags(require_one("title", "title element")))
local description = HTML.get_attribute(
  require_one("meta[name=\"description\"]", "meta description"),
  "content"
)
local canonical_url = HTML.get_attribute(
  require_one("link[rel=\"canonical\"]", "canonical link"),
  "href"
)
local site_title = require_custom_option("site_title")
local site_image = require_custom_option("site_social_image")

function append_meta(target_head, attribute, key, content)
  local element = HTML.create_element("meta")
  HTML.set_attribute(element, attribute, key)
  HTML.set_attribute(element, "content", content)
  HTML.append_child(target_head, element)
end

append_meta(head, "property", "og:type", "website")
append_meta(head, "property", "og:locale", "hr_HR")
append_meta(head, "property", "og:site_name", site_title)
append_meta(head, "property", "og:title", title)
append_meta(head, "property", "og:description", description)
append_meta(head, "property", "og:url", canonical_url)
append_meta(head, "property", "og:image", site_image)

append_meta(head, "name", "twitter:card", "summary")
append_meta(head, "name", "twitter:title", title)
append_meta(head, "name", "twitter:description", description)
append_meta(head, "name", "twitter:image", site_image)
