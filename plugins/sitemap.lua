-- Generates a sitemap from Soupault's page index.
-- SPDX-FileCopyrightText: © 2025 marijan <marijan.petricevic94@gmail.com> (https://marijan.pro)
-- SPDX-License-Identifier: MIT

Plugin.require_version("4.0.0")

data = {}
custom_options = soupault_config["custom_options"]
if not Table.has_key(custom_options, "site_url") then
  Plugin.fail([[custom_options["site_url"] is required when sitemap generation is enabled]])
end

data["site_url"] = Regex.replace(custom_options["site_url"], "/+$", "")

function in_section(entry)
  if config["use_section"] == nil or config["use_section"] == "/" then
    return 1
  end
  return entry["nav_path"][1] == config["use_section"]
end

function tags_match(entry)
  local tag = config["use_tag"]
  if tag == nil then
    return 1
  end
  return Regex.match(entry["tags"] or "", format("\\b%s\\b", tag))
end

entries = {}
local n = 1
local m = 1
local count = size(site_index)
while n <= count do
  entry = site_index[n]
  if in_section(entry) and tags_match(entry) then
    entries[m] = entry
    m = m + 1
  end
  n = n + 1
end

data["entries"] = entries
sitemap_template = Sys.read_file(config["template"])
sitemap = String.render_template(sitemap_template, data)
output_file = config["output_file"] or "sitemap.xml"

Sys.write_file(Sys.join_path(build_dir, output_file), String.trim(sitemap))
