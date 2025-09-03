#!/usr/bin/env python3

def count_to_hundred():
    """Count from 0 to 100 and print each number."""
    for i in range(101):  # range(101) goes from 0 to 100
        print(f"Number: {i}")

def count_with_progress():
    """Count from 0 to 100 with progress indicators."""
    total = 101
    for i in range(total):
        progress = (i / 100) * 100
        if i % 10 == 0:  # Show progress every 10 numbers
            print(f"Progress: {progress:.0f}% - Number: {i}")
        else:
            print(f"Number: {i}")

if __name__ == "__main__":
    print("Counting from 0 to 100:")
    print("=" * 30)
    count_to_hundred()
    print("=" * 30)
    print("Done! Counted 101 numbers total (0-100)")