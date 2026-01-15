from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

from converter import convert_markdown_to_docx, get_available_templates

app = FastAPI(title="Markdown to DOCX Converter")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to templates directory
# Use environment variable or default to relative path
TEMPLATES_DIR = Path(os.environ.get("TEMPLATES_DIR", Path(__file__).resolve().parent.parent / "word-template"))


@app.get("/")
def root():
    return {"message": "Markdown to DOCX Converter API", "status": "running"}


@app.get("/templates")
def list_templates():
    """Get list of available DOCX templates."""
    templates = get_available_templates(str(TEMPLATES_DIR))
    return {"templates": templates}


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    template: str = Form(...)
):
    """
    Convert uploaded Markdown file to DOCX using the selected template.

    Args:
        file: The Markdown file to convert
        template: The template ID to use (filename without extension)

    Returns:
        The converted DOCX file
    """
    # Validate file type
    if not file.filename.endswith((".md", ".markdown", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a Markdown file (.md, .markdown, .txt)"
        )

    # Find template file
    template_path = TEMPLATES_DIR / f"{template}.docx"
    if not template_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Template '{template}' not found"
        )

    # Read uploaded file
    content = await file.read()
    try:
        md_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Could not decode file. Please ensure it's UTF-8 encoded."
        )

    # Convert
    try:
        docx_bytes = convert_markdown_to_docx(md_content, str(template_path))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Generate output filename
    original_name = Path(file.filename).stem
    output_filename = f"{original_name}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"'
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
