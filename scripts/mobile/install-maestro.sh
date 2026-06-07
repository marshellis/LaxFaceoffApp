#!/usr/bin/env bash
# Install Maestro (the cross-platform UI test runner) if it isn't already present.
# Maestro drives both the iOS simulator and the Android emulator with the same YAML flows.
set -euo pipefail

if command -v maestro >/dev/null 2>&1; then
  echo "✅ maestro already installed: $(maestro --version)"
  exit 0
fi

# The official installer drops the binary here but doesn't always patch the current shell's PATH.
if [ -x "$HOME/.maestro/bin/maestro" ]; then
  echo "✅ maestro found at ~/.maestro/bin (add it to PATH)"
  export PATH="$HOME/.maestro/bin:$PATH"
  maestro --version
  echo 'ℹ️  Add this line to your ~/.zshrc so it sticks: export PATH="$HOME/.maestro/bin:$PATH"'
  exit 0
fi

echo "⬇️  Installing Maestro from https://get.maestro.mobile.dev ..."
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$HOME/.maestro/bin:$PATH"
maestro --version
echo "✅ Maestro installed."
echo 'ℹ️  Add this line to your ~/.zshrc so it sticks: export PATH="$HOME/.maestro/bin:$PATH"'
