import pymupdf4llm
from domain.interfaces.document_parser import DocumentParser

class PyMuPDFParser:
    """
    Parser for PDF files using PyMuPDF (pymupdf4llm).
    """
    def parse(self, file_path: str) -> str:
        try:
            # pymupdf4llm.to_markdown extracts text nicely formatted as markdown
            text = pymupdf4llm.to_markdown(file_path)
            return text
        except Exception as e:
            raise RuntimeError(f"Failed to parse PDF file {file_path}: {e}")

class TextParser:
    """
    Parser for plain text files (.txt) and markdown files (.md).
    It treats both as plain text and reads them directly.
    """
    def parse(self, file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            raise RuntimeError(f"Failed to parse text file {file_path}: {e}")

def get_parser_for_file(filename: str) -> DocumentParser:
    """
    Factory function to get the appropriate parser based on file extension.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return PyMuPDFParser()
    elif ext in ["txt", "md"]:
        return TextParser()
    else:
        raise ValueError(f"Unsupported file type: .{ext}")
