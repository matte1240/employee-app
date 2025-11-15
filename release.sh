#!/bin/bash
# Quick release script
# Usage: ./release.sh 1.0.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version number required"
    echo "Usage: ./release.sh 1.0.0"
    exit 1
fi

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo "❌ Error: Invalid version format"
    echo "Expected: 1.0.0 or 1.0.0-beta.1"
    exit 1
fi

echo "🚀 Creating release v$VERSION"

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Releases must be created from 'main' branch"
    echo "   Current branch: '$CURRENT_BRANCH'"
    echo ""
    echo "📋 Correct workflow:"
    echo "   1. git checkout staging && git merge dev && git push origin staging"
    echo "   2. Test on staging server"
    echo "   3. git checkout main && git merge staging && git push origin main"
    echo "   4. ./release.sh $VERSION"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash your changes first"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $CURRENT_BRANCH

# Run checks
echo "🔍 Running checks..."

echo "  - Linting..."
npm run lint || { echo "❌ Lint failed"; exit 1; }

echo "  - Building..."
npm run build --silent || { echo "❌ Build failed"; exit 1; }

echo "  - Validating Prisma schema..."
npx prisma validate || { echo "❌ Prisma validation failed"; exit 1; }

# Create tag
TAG="v$VERSION"
echo "🏷️  Creating tag $TAG..."

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "❌ Error: Tag $TAG already exists"
    exit 1
fi

# Prompt for release notes
echo ""
echo "📝 Enter release notes (press Ctrl+D when done):"
RELEASE_NOTES=$(cat)

if [ -z "$RELEASE_NOTES" ]; then
    RELEASE_NOTES="Release $TAG"
fi

# Create annotated tag
git tag -a "$TAG" -m "$RELEASE_NOTES"

# Show tag info
echo ""
echo "✅ Tag created successfully!"
echo ""
git show "$TAG" --no-patch

echo ""
read -p "🚀 Push tag to GitHub? This will trigger the release workflow. (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing tag to origin..."
    git push origin "$TAG"
    
    echo ""
    echo "✅ Release v$VERSION is being built!"
    echo ""
    echo "🔗 View progress at:"
    echo "   https://github.com/matte1240/employee-app/actions"
    echo ""
    echo "🔗 Release will be available at:"
    echo "   https://github.com/matte1240/employee-app/releases/tag/$TAG"
    echo ""
    echo "🐳 Docker image will be available at:"
    echo "   ghcr.io/matte1240/employee-app:$VERSION"
    echo "   ghcr.io/matte1240/employee-app:latest"
else
    echo ""
    echo "ℹ️  Tag created locally but not pushed"
    echo "   To push later: git push origin $TAG"
    echo "   To delete:    git tag -d $TAG"
fi
