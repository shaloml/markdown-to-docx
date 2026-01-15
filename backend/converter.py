import subprocess
import tempfile
import os
from pathlib import Path


def convert_markdown_to_docx(md_content: str, template_path: str) -> bytes:
    """
    Convert Markdown content to DOCX using Pandoc.
    Adds RTL Hebrew configuration via YAML front matter.

    Args:
        md_content: The markdown content to convert
        template_path: Path to the reference DOCX template

    Returns:
        The converted DOCX file as bytes
    """
    # Pre-process: Convert task list checkboxes to symbols before Pandoc
    # This ensures proper rendering in Word
    md_content = md_content.replace("- [x] ", "- ✓ ")
    md_content = md_content.replace("- [X] ", "- ✓ ")
    md_content = md_content.replace("- [ ] ", "- ☐ ")
    md_content = md_content.replace("* [x] ", "* ✓ ")
    md_content = md_content.replace("* [X] ", "* ✓ ")
    md_content = md_content.replace("* [ ] ", "* ☐ ")

    yaml_header = """---
dir: rtl
lang: he
mainfont: David
---

"""
    full_content = yaml_header + md_content

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, "input.md")
        output_path = os.path.join(tmpdir, "output.docx")

        with open(input_path, "w", encoding="utf-8") as f:
            f.write(full_content)

        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        filter_path = os.path.join(script_dir, "filters.lua")

        cmd = [
            "pandoc",
            f"--reference-doc={template_path}",
            f"--lua-filter={filter_path}",
            "-f", "markdown+lists_without_preceding_blankline+task_lists",
            "-t", "docx",
            "--highlight-style=tango",
            input_path,
            "-o", output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise RuntimeError(f"Pandoc conversion failed: {result.stderr}")

        with open(output_path, "rb") as f:
            return f.read()


def get_available_templates(templates_dir: str) -> list[dict]:
    """
    Get list of available DOCX templates from the templates directory.

    Args:
        templates_dir: Path to the directory containing template files

    Returns:
        List of template info dicts with id and name
    """
    templates = []
    templates_path = Path(templates_dir)

    if not templates_path.exists():
        return templates

    for file in templates_path.glob("*.docx"):
        # Extract name from filename (e.g., TEMPLAE-MACCABI.docx -> MACCABI)
        name_part = file.stem.replace("TEMPLAE-", "").replace("TEMPLATE-", "")
        templates.append({
            "id": file.stem,
            "name": name_part,
            "filename": file.name
        })

    return sorted(templates, key=lambda x: x["name"])
