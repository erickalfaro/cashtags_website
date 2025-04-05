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
    
    # Extended patterns to ignore for Vercel/Next.js projects plus your specific patterns
    local default_ignore=(
        ".git/" ".gitignore" "node_modules/" "package-lock.json" "yarn.lock" "*.lock"
        "dist/" "build/" ".next/" "out/" "*.log" "*.log.*" "*.tmp"
        "*.png" "*.jpg" "*.jpeg" "*.gif" "*.svg" "*.ico" "*.webp" "docs/"
        "*.woff" "*.woff2" "*.ttf" "*.eot" "*.min.js" "*.min.css" "*.map"
        ".vercel/" "vercel.json" ".env" ".env.*" "coverage/" "test/"
        "__tests__/" "*.test.*" "*.spec.*" "vendor/" "*.bak" "*.swp" "*.swo"
        # Your specific .gitignore patterns
        "/node_modules" "/.pnp" ".pnp.*" ".yarn/*" "!.yarn/patches" "!.yarn/plugins"
        "!.yarn/releases" "!.yarn/versions" "/coverage" "/.next/" "/out/" "/build"
        ".DS_Store" "*.pem" "npm-debug.log*" "yarn-debug.log*" "yarn-error.log*"
        ".pnpm-debug.log*" "*.tsbuildinfo" "next-env.d.ts" "$OUTPUT_FILE"
    )
    
    # Check against default ignore patterns
    for pattern in "${default_ignore[@]}"; do
        # Handle negation patterns (starting with !)
        if [[ "$pattern" =~ ^! ]]; then
            pattern=${pattern#!}
            regex=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
            if [[ "$path" =~ $regex ]]; then
                return 1  # Do not ignore if it matches a negation pattern
            fi
        else
            regex=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
            if [[ "$path" =~ $regex ]]; then
                return 0  # Ignore if it matches a regular pattern
            fi
        fi
    done
    
    # If .gitignore exists, check against its patterns
    if [ -f ".gitignore" ]; then
        grep -v '^#' .gitignore | grep -v '^$' > "$TEMP_GITIGNORE"
        while IFS= read -r pattern; do
            [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
            
            # Handle negation patterns in .gitignore
            if [[ "$pattern" =~ ^! ]]; then
                pattern=${pattern#!}
                regex=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
                if [[ "$path" =~ $regex ]]; then
                    return 1  # Do not ignore if it matches a negation pattern
                fi
            else
                pattern=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
                if [[ "$path" =~ $regex ]]; then
                    return 0  # Ignore if it matches a regular pattern
                fi
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
    
    # Collect files that are not ignored and are text files
    files=()
    while IFS= read -r file; do
        if [ -f "$file" ] && ! should_ignore "$file" && ! file "$file" | grep -q "executable\|binary\|image\|font"; then
            files+=("$file")
        fi
    done < <(git ls-files)
    
    # Sort the files
    sorted_files=($(printf '%s\n' "${files[@]}" | sort))
    
    # Initialize current_path
    current_path=()
    
    for file in "${sorted_files[@]}"; do
        IFS='/' read -ra path_components <<< "$file"
        
        # Find common prefix length
        common_prefix=0
        for ((i=0; i<${#current_path[@]} && i<${#path_components[@]}-1; i++)); do
            if [ "${current_path[$i]}" != "${path_components[$i]}" ]; then
                break
            fi
            common_prefix=$((i+1))
        done
        
        # Print directories from common_prefix to ${#path_components[@]}-2
        for ((i=common_prefix; i<${#path_components[@]}-1; i++)); do
            printf "%*s%s/\n" $((i * 2)) "" "${path_components[$i]}" >> "$OUTPUT_FILE"
        done
        
        # Print the file name
        printf "%*s%s\n" $(((${#path_components[@]}-1) * 2)) "" "${path_components[-1]}" >> "$OUTPUT_FILE"
        
        # Update current_path
        current_path=("${path_components[@]}")
    done
    
    # Add spacing after the structure
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

# Export functions for use in subshells
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