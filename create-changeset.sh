#!/bin/bash

# Check if package name is provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 <package-name> <bump-type> [message]"
  echo "Example: $0 work-journal patch 'Fixed a bug in the CLI'"
  exit 1
fi

PACKAGE_NAME=$1
BUMP_TYPE=$2
MESSAGE=${3:-"Automated changeset"}  # Default message if not provided

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Bump type must be 'patch', 'minor', or 'major'"
  exit 1
fi

# Create a changeset file directly with a human-readable ID
# Format: [package-name]-[bump-type]-[YYYYMMDD]-[short-random]
CURRENT_DATE=$(date +%Y%m%d)
SHORT_RANDOM=$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c-4)
CHANGESET_ID="${PACKAGE_NAME}-${BUMP_TYPE}-${CURRENT_DATE}-${SHORT_RANDOM}"
CHANGESET_DIR=".changeset"
CHANGESET_FILE="$CHANGESET_DIR/${CHANGESET_ID}.md"

# Create the content for the changeset file
cat > "$CHANGESET_FILE" << EOL
---
"$PACKAGE_NAME": $BUMP_TYPE
---

$MESSAGE
EOL

echo "✅ Changeset created at $CHANGESET_FILE"
echo "   - Package: $PACKAGE_NAME"
echo "   - Bump type: $BUMP_TYPE"
echo "   - Message: $MESSAGE" 