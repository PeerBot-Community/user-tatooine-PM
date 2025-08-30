def fibonacci(n):
    """
    Calculate the nth Fibonacci number.
    
    Args:
        n (int): Position in Fibonacci sequence (0-indexed)
    
    Returns:
        int: The nth Fibonacci number
    
    Raises:
        ValueError: If n is negative
    """
    if n < 0:
        raise ValueError("Input must be non-negative")
    
    if n <= 1:
        return n
    
    # Use iterative approach for efficiency
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    
    return b


def fibonacci_sequence(count):
    """
    Generate a sequence of Fibonacci numbers.
    
    Args:
        count (int): Number of Fibonacci numbers to generate
    
    Returns:
        list: List of Fibonacci numbers
    """
    if count <= 0:
        return []
    
    sequence = []
    for i in range(count):
        sequence.append(fibonacci(i))
    
    return sequence


# Test the functions
if __name__ == "__main__":
    print("Single Fibonacci numbers:")
    for i in range(10):
        print(f"fibonacci({i}) = {fibonacci(i)}")
    
    print(f"\nFirst 15 Fibonacci numbers: {fibonacci_sequence(15)}")