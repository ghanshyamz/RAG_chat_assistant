from typing import Protocol

class DocumentParser(Protocol):
    """
    Interface for parsing different file types (e.g., .pdf, .txt, .md)
    into raw text strings.
    """
    
    def parse(self, file_path: str) -> str:
        """
        Extracts raw text from the file located at `file_path`.
        
        Args:
            file_path: The absolute path to the file.
            
        Returns:
            The extracted text as a string.
        """
        ...
