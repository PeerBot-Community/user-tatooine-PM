#!/usr/bin/env python3
"""
File processor script that demonstrates file opening, reading, and content processing.
"""

import os
import sys
from pathlib import Path


def process_content(content: str) -> str:
    """
    Process the file content. Customize this function for specific needs.
    Default processing: count lines, words, and characters.
    """
    lines = content.split('\n')
    words = content.split()
    chars = len(content)
    
    processed_data = {
        'lines': len(lines),
        'words': len(words),
        'characters': chars,
        'non_empty_lines': len([line for line in lines if line.strip()])
    }
    
    return f"""File Processing Results:
- Lines: {processed_data['lines']}
- Non-empty lines: {processed_data['non_empty_lines']}
- Words: {processed_data['words']}
- Characters: {processed_data['characters']}
"""


def process_file(file_path: str) -> None:
    """
    Main function to open, read, and process a file.
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' not found.")
            return
        
        # Open and read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        print(f"Successfully read file: {file_path}")
        print(f"File size: {len(content)} characters\n")
        
        # Process the content
        result = process_content(content)
        print(result)
        
        # Optional: Save processed results to a new file
        output_path = f"{file_path}.processed"
        with open(output_path, 'w', encoding='utf-8') as output_file:
            output_file.write(result)
        
        print(f"Processing results saved to: {output_path}")
        
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
    except PermissionError:
        print(f"Error: Permission denied accessing '{file_path}'.")
    except UnicodeDecodeError:
        print(f"Error: Unable to decode file '{file_path}'. It might be a binary file.")
    except Exception as e:
        print(f"Unexpected error: {e}")


def main():
    """
    Main entry point of the script.
    """
    if len(sys.argv) != 2:
        print("Usage: python file_processor.py <file_path>")
        print("Example: python file_processor.py data.txt")
        sys.exit(1)
    
    file_path = sys.argv[1]
    process_file(file_path)


if __name__ == "__main__":
    main()