-- Lua filter for Pandoc to handle LTR code blocks in RTL documents
-- This version preserves syntax highlighting

-- Process code blocks to ensure LTR direction while keeping syntax highlighting
function CodeBlock(block)
  -- Add custom-style attribute for LTR
  block.attr.attributes["custom-style"] = "Source Code"

  -- Wrap in a Div with LTR direction
  -- This preserves Pandoc's syntax highlighting
  return pandoc.Div(
    {block},
    pandoc.Attr("", {"ltr-code"}, {{"dir", "ltr"}})
  )
end
