// 📁 descriptionHelper.ts - Utility for parsing item descriptions
// 🎯 Core function: Safely parse JSON descriptions and extract human-readable text
// 🔗 Key dependencies: None (pure utility)
// 💡 Usage: Use parseDescription() to handle both JSON and plain text descriptions

/**
 * Safely parses item descriptions that may be stored as JSON strings
 * @param description - The description string (may be JSON or plain text)
 * @returns The human-readable description text
 */
export const parseDescription = (description: string | undefined | null): string => {
  if (!description || typeof description !== 'string') {
    return '';
  }

  try {
    const parsed = JSON.parse(description);
    
    // If parsed is an object with a description field, return that
    if (parsed && typeof parsed === 'object' && 'description' in parsed) {
      return parsed.description || description;
    }
    
    // If parsing succeeded but no description field found, return original
    return description;
  } catch {
    // If JSON parsing fails, return the original string
    return description;
  }
};
