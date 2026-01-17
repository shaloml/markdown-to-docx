# MCP Server for Markdown to RTL DOCX Conversion

This MCP (Model Context Protocol) server exposes the markdown-to-docx conversion functionality as tools that can be used by Claude Code and other MCP-compatible clients.

## Features

- Convert Markdown content directly to RTL Hebrew Word documents
- Convert Markdown files to RTL Hebrew Word documents
- List and select from multiple document templates
- Full Hebrew RTL support with David font
- Syntax highlighting for code blocks
- Task list checkbox support

## Installation

1. Ensure you have Python 3.10+ installed
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Ensure Pandoc is installed:

```bash
# Ubuntu/Debian
sudo apt-get install pandoc

# macOS
brew install pandoc
```

## Available Tools

### `list_templates()`

Lists all available DOCX templates for conversion.

**Returns:** List of template objects with `id`, `name`, and `filename`

### `convert_markdown_to_rtl_docx(markdown_content, output_path, template_id?)`

Converts Markdown text directly to an RTL Hebrew Word document.

**Parameters:**
- `markdown_content` (str): The markdown text to convert
- `output_path` (str): Where to save the output .docx file
- `template_id` (str, optional): Template to use (default: "style-clear")

### `convert_markdown_file_to_rtl_docx(input_path, output_path?, template_id?)`

Converts a Markdown file to an RTL Hebrew Word document.

**Parameters:**
- `input_path` (str): Path to the input .md file
- `output_path` (str, optional): Where to save the output (defaults to input name with .docx)
- `template_id` (str, optional): Template to use (default: "style-clear")

## Available Resources

- `templates://list` - Get a formatted list of all available templates
- `templates://{template_id}` - Get detailed info about a specific template

## Usage with Claude Code

### Option 1: Use the project's `.mcp.json` configuration

The project includes an `.mcp.json` file that automatically configures the server when you open the project in Claude Code.

### Option 2: Manual registration

```bash
claude mcp add --transport stdio --scope project markdown-to-docx -- python mcp-server/server.py
```

### Option 3: Run standalone

```bash
python mcp-server/server.py
```

## Available Templates

| Template ID | Description |
|------------|-------------|
| style-clear | Clean, minimal style (default) |
| style-blue | Blue-themed professional style |
| style-black | Black-themed style |

## Supported Markdown Features

- Headers (H1-H6)
- Bold and italic text
- Bullet and numbered lists
- Task lists with checkboxes
- Code blocks with syntax highlighting
- Blockquotes
- Tables
- Links

## Example Usage in Claude Code

After the MCP server is registered, you can use natural language:

> "Convert this markdown to Word: # Hello World\n\nThis is a test document."

Or use the `/word-rtl` skill for guided conversion.
