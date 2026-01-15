-- Lua filter for Pandoc to handle LTR code blocks in RTL documents

-- Process code blocks to ensure LTR direction
function CodeBlock(block)
  -- Create a RawBlock with OpenXML to set paragraph direction to LTR
  local code_text = block.text
  local lang = block.classes[1] or ""

  -- Escape XML special characters
  code_text = code_text:gsub("&", "&amp;")
  code_text = code_text:gsub("<", "&lt;")
  code_text = code_text:gsub(">", "&gt;")

  -- Split code into lines and wrap each in a paragraph with LTR direction
  local lines = {}
  for line in (code_text .. "\n"):gmatch("(.-)\n") do
    table.insert(lines, line)
  end

  local xml_parts = {}
  for _, line in ipairs(lines) do
    -- Each line as a paragraph with LTR direction and monospace font
    table.insert(xml_parts, string.format([[
<w:p>
  <w:pPr>
    <w:bidi w:val="0"/>
    <w:jc w:val="left"/>
    <w:pStyle w:val="SourceCode"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
      <w:sz w:val="20"/>
      <w:rtl w:val="0"/>
    </w:rPr>
    <w:t xml:space="preserve">%s</w:t>
  </w:r>
</w:p>]], line))
  end

  local xml = table.concat(xml_parts, "\n")

  return pandoc.RawBlock("openxml", xml)
end
