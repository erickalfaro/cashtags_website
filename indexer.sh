#!/bin/bash

# Name of the output file
OUTPUT_FILE="codebase_manifest.txt"
# Temporary file to store gitignore patterns
TEMP_GITIGNORE=".temp_gitignore"

# Create or clear the output file
> "$OUTPUT_FILE"

# Function to check if a file should be ignored
should_ignore() {
    local path="$1"
    
    # Extended patterns to ignore for Vercel/Next.js projects
    local default_ignore=(
        ".git/" ".gitignore" "node_modules/" "package-lock.json" "yarn.lock" "*.lock"
        "dist/" "build/" ".next/" "out/" "*.log" "*.log.*" "*.tmp"
        "*.png" "*.jpg" "*.jpeg" "*.gif" "*.svg" "*.ico" "*.webp"
        "*.woff" "*.woff2" "*.ttf" "*.eot" "*.min.js" "*.min.css" "*.map"
        ".vercel/" "vercel.json" ".env" ".env.*" "*.md" "coverage/" "test/"
        "__tests__/" "*.test.*" "*.spec.*" "vendor/" "*.bak" "*.swp" "*.swo"
    )
    
    # Check against default ignore patterns
    for pattern in "${default_ignore[@]}"; do
        regex=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
        if [[ "$path" =~ $regex ]]; then
            return 0
        fi
    done
    
    # If .gitignore exists, check against its patterns
    if [ -f ".gitignore" ]; then
        grep -v '^#' .gitignore | grep -v '^$' > "$TEMP_GITIGNORE"
        while IFS= read -r pattern; do
            [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
            pattern=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
            if [[ "$path" =~ $pattern ]]; then
                return 0
            fi
        done < "$TEMP_GITIGNORE"
        rm -f "$TEMP_GITIGNORE"
    fi
    
    return 1
}

# Function to generate directory structure
generate_directory_structure() {
    echo "Directory Structure:" >> "$OUTPUT_FILE"
    echo "====================" >> "$OUTPUT_FILE"
    
    # Get the root directory name (current directory)
    local root_dir=$(basename "$(pwd)")
    
    # Start the tree with the root directory
    echo "└── ${root_dir}/" >> "$OUTPUT_FILE"
    
    # Use git ls-files to get tracked files, then build the structure
    git ls-files | while IFS= read -r file; do
        if [ -f "$file" ] && ! should_ignore "$file"; then
            # Split the file path into components
            IFS='/' read -ra parts <<< "$file"
            local indent="    "  # Initial indent after root
            
            # Build the path level by level
            for ((i=0; i<${#parts[@]}-1; i++)); do
                # Print directories with proper indentation
                echo "${indent}├── ${parts[$i]}/" >> "$OUTPUT_FILE"
                indent="${indent}│   "  # Increase indent for next level
            done
            
            # Print the file with its final indent
            echo "${indent}└── ${parts[-1]}" >> "$OUTPUT_FILE"
        fi
    done
    
    # Add some spacing after the structure
    echo -e "\n\n" >> "$OUTPUT_FILE"
}

# Function to process a file
process_file() {
    local file="$1"
    
    if should_ignore "$file"; then
        return
    fi
    
    if file "$file" | grep -q "executable\|binary\|image\|font"; then
        return
    fi
    
    echo "==================================================" >> "$OUTPUT_FILE"
    echo "File: $file" >> "$OUTPUT_FILE"
    echo "==================================================" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: This script must be run inside a git repository"
    exit 1
fi

# Export functions for find to use
export -f should_ignore process_file

# Generate the directory structure at the top
generate_directory_structure

# Process all files tracked by git
git ls-files | while IFS= read -r file; do
    if [ -f "$file" ]; then
        process_file "$file"
    fi
done

echo "Codebase digest created in $OUTPUT_FILE"