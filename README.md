# Markdown to DOCX Converter

A web application that converts Markdown files to Word documents (DOCX) with full Hebrew and RTL support.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61dafb.svg)

## Features

- **Hebrew RTL Support** - Full right-to-left text support for Hebrew documents
- **Multiple Templates** - Choose from different DOCX templates
- **Two Input Methods**:
  - Paste Markdown content directly
  - Upload Markdown files (.md, .markdown, .txt)
- **Docker Ready** - Easy deployment with Docker Compose
- **Modern UI** - Clean React interface with Tailwind CSS

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/markdown-to-docx.git
cd markdown-to-docx

# Start with Docker Compose
docker compose up -d

# Open in browser
open http://localhost:3000
```

## Manual Installation

### Prerequisites

- Python 3.11+
- Node.js 20+
- Pandoc

### Backend Setup

```bash
# Install Pandoc
sudo apt-get install pandoc  # Ubuntu/Debian
brew install pandoc          # macOS

# Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

```
markdown-to-docx/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── converter.py         # Pandoc conversion logic
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── App.tsx          # React application
│   ├── package.json
│   ├── nginx.conf           # Production nginx config
│   └── Dockerfile
├── word-template/           # DOCX templates
│   ├── style-clear.docx
│   ├── style-blue.docx
│   └── style-black.docx
├── docker-compose.yml
└── README.md
```

## API Endpoints

### GET /templates

Returns available DOCX templates.

```json
{
  "templates": [
    {"id": "style-clear", "name": "Clear", "filename": "style-clear.docx"},
    {"id": "style-blue", "name": "Blue", "filename": "style-blue.docx"},
    {"id": "style-black", "name": "Black", "filename": "style-black.docx"}
  ]
}
```

### POST /convert

Converts Markdown to DOCX.

**Request:** `multipart/form-data`
- `file`: Markdown file
- `template`: Template ID

**Response:** DOCX file download

## Adding Custom Templates

1. Create your DOCX template in Microsoft Word
2. Style the document with your desired formatting (fonts, headers, etc.)
3. Set document direction to RTL for Hebrew support
4. Choose a Hebrew-compatible font (David, Arial, etc.)
5. Define heading styles (Heading 1, 2, 3...)
6. Save as `.docx` in the `word-template/` directory
7. Restart the application

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEMPLATES_DIR` | Path to templates directory | `../word-template` |

### Docker Compose Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Web interface |
| Backend | 8000 | API (internal) |

## Development

### Building for Production

```bash
# Build Docker images
docker compose build

# Run in production
docker compose up -d
```

## How It Works

1. User inputs Markdown (paste or upload)
2. Frontend sends file to FastAPI backend
3. Backend adds RTL YAML front matter:
   ```yaml
   ---
   dir: rtl
   lang: he
   mainfont: David
   ---
   ```
4. Pandoc converts Markdown to DOCX using the selected template
5. DOCX file is returned for download

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Pandoc](https://pandoc.org/) - Universal document converter
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
