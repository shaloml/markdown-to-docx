-- Lua filter for Pandoc to handle LTR code blocks in RTL documents
-- This version preserves syntax highlighting

function CodeBlock(block)
  -- Add custom-style attribute
  block.attr.attributes["custom-style"] = "Source Code"

  -- Wrap in a Div with LTR direction to keep code readable
  return pandoc.Div(
    {block},
    pandoc.Attr("", {"ltr-code"}, {{"dir", "ltr"}})
  )
end
