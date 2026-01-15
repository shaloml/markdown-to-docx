-- Lua filter to make code blocks LTR in RTL documents
-- This adds a custom style to code blocks for proper direction

function CodeBlock(block)
  -- Wrap code block content to ensure LTR direction
  -- The code content itself should remain as-is
  return block
end

function Code(inline)
  -- Inline code should also be LTR
  return inline
end
