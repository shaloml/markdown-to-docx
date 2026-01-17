#!/usr/bin/env python3
"""
MCP Server for markdown-to-docx conversion.

Exposes markdown to RTL DOCX conversion as MCP tools for use with Claude Code
and other MCP-compatible clients.
"""

import os
import sys
from pathlib import Path

# Add backend to path for converter import
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from mcp.server.fastmcp import FastMCP
from converter import convert_markdown_to_docx, get_available_templates

# Initialize MCP server
mcp = FastMCP("markdown-to-docx")

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
TEMPLATES_DIR = PROJECT_ROOT / "word-template"


def _get_template_path(template_id: str | None = None) -> str:
    """Get the full path to a template file."""
    if template_id is None:
        template_id = "style-clear"

    # Ensure .docx extension
    if not template_id.endswith(".docx"):
        template_id = f"{template_id}.docx"

    template_path = TEMPLATES_DIR / template_id

    if not template_path.exists():
        available = [t["id"] for t in get_available_templates(str(TEMPLATES_DIR))]
        raise ValueError(
            f"Template '{template_id}' not found. "
            f"Available templates: {', '.join(available)}"
        )

    return str(template_path)


@mcp.tool()
def list_templates() -> list[dict]:
    """
    List available DOCX templates for RTL conversion.

    Returns a list of templates with their IDs and names.
    Use the template ID when calling conversion tools.

    Available templates:
    - style-clear: Clean, minimal style (default)
    - style-blue: Blue-themed professional style
    - style-black: Black-themed style
    """
    return get_available_templates(str(TEMPLATES_DIR))


@mcp.tool()
def convert_markdown_to_rtl_docx(
    markdown_content: str,
    output_path: str,
    template_id: str | None = None
) -> str:
    """
    Convert Markdown content to an RTL Hebrew Word document.

    This tool converts markdown text directly to a DOCX file with:
    - Right-to-left (RTL) text direction
    - Hebrew language support
    - David font as the default
    - Syntax highlighting for code blocks
    - Task list checkbox support

    Args:
        markdown_content: The markdown text to convert
        output_path: Where to save the output .docx file (absolute path)
        template_id: Optional template ID (default: style-clear).
                    Use list_templates() to see available options.

    Returns:
        Success message with the output file path

    Example markdown features supported:
    - Headers (# ## ###)
    - Bold (**text**) and italic (*text*)
    - Bullet and numbered lists
    - Task lists (- [ ] and - [x])
    - Code blocks with syntax highlighting
    - Blockquotes (>)
    - Tables
    """
    template_path = _get_template_path(template_id)

    # Convert
    docx_bytes = convert_markdown_to_docx(markdown_content, template_path)

    # Ensure output directory exists
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Write output
    with open(output_file, "wb") as f:
        f.write(docx_bytes)

    return f"Successfully created RTL Word document: {output_path}"


@mcp.tool()
def convert_markdown_file_to_rtl_docx(
    input_path: str,
    output_path: str | None = None,
    template_id: str | None = None
) -> str:
    """
    Convert a Markdown file to an RTL Hebrew Word document.

    Reads a markdown file and converts it to DOCX with RTL Hebrew support.

    Args:
        input_path: Path to the input .md file (absolute path)
        output_path: Where to save the output .docx file.
                    If not provided, uses the same name as input with .docx extension.
        template_id: Optional template ID (default: style-clear).
                    Use list_templates() to see available options.

    Returns:
        Success message with the output file path
    """
    input_file = Path(input_path)

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not input_file.suffix.lower() == ".md":
        raise ValueError(f"Input file must be a .md file, got: {input_file.suffix}")

    # Read input
    with open(input_file, "r", encoding="utf-8") as f:
        markdown_content = f.read()

    # Determine output path
    if output_path is None:
        output_path = str(input_file.with_suffix(".docx"))

    # Use the content conversion tool
    return convert_markdown_to_rtl_docx(markdown_content, output_path, template_id)


@mcp.resource("templates://list")
def templates_list_resource() -> str:
    """List of available DOCX templates as a formatted string."""
    templates = get_available_templates(str(TEMPLATES_DIR))
    lines = ["Available RTL Word Templates:", ""]
    for t in templates:
        lines.append(f"- {t['id']}: {t['name']}")
    lines.append("")
    lines.append("Default: style-clear")
    return "\n".join(lines)


@mcp.resource("templates://{template_id}")
def template_info_resource(template_id: str) -> str:
    """Get information about a specific template."""
    templates = get_available_templates(str(TEMPLATES_DIR))

    for t in templates:
        if t["id"] == template_id:
            template_path = TEMPLATES_DIR / t["filename"]
            size_kb = template_path.stat().st_size / 1024
            return f"""Template: {t['id']}
Name: {t['name']}
Filename: {t['filename']}
Size: {size_kb:.1f} KB
Path: {template_path}"""

    available = [t["id"] for t in templates]
    return f"Template '{template_id}' not found. Available: {', '.join(available)}"


if __name__ == "__main__":
    # Run the server with stdio transport
    mcp.run(transport="stdio")
