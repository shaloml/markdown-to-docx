---
name: word-rtl
description: Convert Markdown to RTL Hebrew Word documents
---

# Word RTL Conversion Skill

This skill helps you convert Markdown content to RTL (Right-to-Left) Hebrew Word documents (.docx) using the markdown-to-docx MCP server.

## When to Use This Skill

Use `/word-rtl` when you need to:
- Convert Markdown text to a Word document with Hebrew RTL support
- Convert a Markdown file (.md) to Word format
- Create professional Hebrew documents from markdown content

## Available MCP Tools

The `markdown-to-docx` MCP server provides these tools:

### `list_templates`
Lists available document templates.

### `convert_markdown_to_rtl_docx`
Converts Markdown content directly to DOCX.

Parameters:
- `markdown_content` (required): The markdown text
- `output_path` (required): Where to save the .docx file
- `template_id` (optional): Template to use

### `convert_markdown_file_to_rtl_docx`
Converts a Markdown file to DOCX.

Parameters:
- `input_path` (required): Path to the .md file
- `output_path` (optional): Output path (defaults to same name with .docx)
- `template_id` (optional): Template to use

## Available Templates

| Template | Description |
|----------|-------------|
| `style-clear` | Clean, minimal style (default) |
| `style-blue` | Blue-themed professional style |
| `style-black` | Black-themed style |

## Usage Examples

### Convert Markdown Text
When the user provides markdown content to convert:

1. Ask for output filename if not specified
2. Ask for template preference if user wants customization
3. Use `convert_markdown_to_rtl_docx` tool

### Convert Markdown File
When the user wants to convert a .md file:

1. Verify the file exists using Read tool
2. Ask for output location if needed
3. Use `convert_markdown_file_to_rtl_docx` tool

## Supported Markdown Features

- **Headers**: `# H1` through `###### H6`
- **Emphasis**: `**bold**`, `*italic*`
- **Lists**: Bullet (`-`), numbered (`1.`), and task lists (`- [ ]`, `- [x]`)
- **Code**: Inline `` `code` `` and fenced code blocks with syntax highlighting
- **Blockquotes**: `> quoted text`
- **Tables**: Standard markdown tables
- **Links**: `[text](url)`

## Error Handling

Common errors and solutions:

- **Template not found**: Use `list_templates` to see available options
- **File not found**: Verify the input file path is correct
- **Pandoc not installed**: User needs to install Pandoc (`apt install pandoc` or `brew install pandoc`)

## Workflow

1. Identify what the user wants to convert (content or file)
2. Determine output location
3. Ask about template preference if relevant
4. Execute the appropriate MCP tool
5. Confirm success and provide the output file path
