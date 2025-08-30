#!/usr/bin/env python3
"""
Enhanced file processor with comprehensive error handling.
Opens, reads, and processes file content with robust exception handling.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_content(content: str) -> Dict[str, Any]:
    """
    Process file content and return statistics.
    
    Args:
        content: File content as string
        
    Returns:
        Dictionary with processing results
    """
    try:
        lines = content.split('\n')
        words = content.split()
        
        return {
            'lines': len(lines),
            'words': len(words),
            'characters': len(content),
            'non_empty_lines': len([line for line in lines if line.strip()]),
            'average_line_length': sum(len(line) for line in lines) / len(lines) if lines else 0
        }
    except Exception as e:
        logger.error(f"Error processing content: {e}")
        raise


def validate_file_path(file_path: str) -> bool:
    """
    Validate file path and accessibility.
    
    Args:
        file_path: Path to file
        
    Returns:
        True if valid, False otherwise
    """
    try:
        path = Path(file_path)
        
        if not path.exists():
            logger.error(f"File does not exist: {file_path}")
            return False
            
        if not path.is_file():
            logger.error(f"Path is not a file: {file_path}")
            return False
            
        if not os.access(file_path, os.R_OK):
            logger.error(f"No read permission for file: {file_path}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error validating file path: {e}")
        return False


def process_file(file_path: str) -> Optional[str]:
    """
    Main function to safely process a file.
    
    Args:
        file_path: Path to file to process
        
    Returns:
        Processing results as string, or None on error
    """
    try:
        # Validate file first
        if not validate_file_path(file_path):
            return None
        
        # Read file with multiple encoding attempts
        content = None
        encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    content = file.read()
                logger.info(f"Successfully read file with {encoding} encoding")
                break
            except UnicodeDecodeError:
                logger.warning(f"Failed to decode with {encoding}")
                continue
        
        if content is None:
            logger.error(f"Could not decode file with any supported encoding")
            return None
        
        # Process content
        stats = process_content(content)
        
        # Format results
        result = f"""File Processing Results for: {file_path}
====================================================
File size: {len(content):,} characters
Lines: {stats['lines']:,}
Non-empty lines: {stats['non_empty_lines']:,}
Words: {stats['words']:,}
Average line length: {stats['average_line_length']:.1f} characters
"""
        
        logger.info("File processing completed successfully")
        return result
        
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
    except PermissionError:
        logger.error(f"Permission denied: {file_path}")
    except IsADirectoryError:
        logger.error(f"Path is a directory, not a file: {file_path}")
    except OSError as e:
        logger.error(f"OS error accessing file {file_path}: {e}")
    except MemoryError:
        logger.error(f"Not enough memory to read file: {file_path}")
    except Exception as e:
        logger.error(f"Unexpected error processing {file_path}: {e}")
    
    return None


def save_results(results: str, output_path: str) -> bool:
    """
    Safely save processing results to file.
    
    Args:
        results: Processing results to save
        output_path: Output file path
        
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as file:
            file.write(results)
        logger.info(f"Results saved to: {output_path}")
        return True
        
    except PermissionError:
        logger.error(f"Permission denied writing to: {output_path}")
    except OSError as e:
        logger.error(f"OS error writing to {output_path}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error saving results: {e}")
        
    return False


def main():
    """Main entry point with comprehensive error handling."""
    try:
        if len(sys.argv) != 2:
            print("Usage: python3 file_processor.py <file_path>")
            print("Example: python3 file_processor.py document.txt")
            sys.exit(1)
        
        file_path = sys.argv[1]
        
        # Process the file
        results = process_file(file_path)
        
        if results is None:
            logger.error("File processing failed")
            sys.exit(1)
        
        # Display results
        print(results)
        
        # Save results
        output_path = f"{file_path}.processed"
        if save_results(results, output_path):
            print(f"\nResults also saved to: {output_path}")
        else:
            logger.warning("Could not save results to file")
            
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"Critical error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()