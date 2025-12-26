import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def parse_pdf(file_content: bytes) -> str:
    """Parse PDF file and extract text."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError(f"Failed to parse PDF: {e}")


def parse_docx(file_content: bytes) -> str:
    """Parse DOCX file and extract text."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise ValueError(f"Failed to parse DOCX: {e}")


def parse_resume(file_content: bytes, filename: str) -> str:
    """Parse resume file based on extension."""
    filename_lower = filename.lower()

    if filename_lower.endswith('.pdf'):
        return parse_pdf(file_content)
    elif filename_lower.endswith('.docx'):
        return parse_docx(file_content)
    elif filename_lower.endswith('.txt'):
        return file_content.decode('utf-8')
    else:
        # Try to decode as text
        try:
            return file_content.decode('utf-8')
        except:
            raise ValueError(f"Unsupported file format: {filename}")
