#!/usr/bin/env bash
set -euo pipefail

print_help() {
  cat <<-EOF

		Downloads a file to a given destination.

		This is optimized for the case where the data at the URL is immutable.
		If that exact same URL has been previously downloaded to that exact same location,
		the download will be skipped.
	EOF

  print_usage
}

print_usage() {
  cat <<-EOF

		Usage:
		  $(basename "$0") <URL> <DOWNLOAD_PATH>
	EOF
}

[[ "${1:-}" != "--help" ]] || {
  print_help
  exit 0
}

(($# == 2)) || {
  echo "ERROR: There should be two arguments."
  print_usage

  exit 1
}

URL="$1"
DOWNLOAD_DESTINATION="$2"
# Compute a short hash of the URL in a portable way (Linux/macOS)
if command -v sha256sum >/dev/null 2>&1; then
  URL_HASH="$(echo "$URL" | sha256sum | awk '{print substr($1,1,10)}')"
elif command -v gsha256sum >/dev/null 2>&1; then
  # Homebrew coreutils on macOS install gsha256sum
  URL_HASH="$(echo "$URL" | gsha256sum | awk '{print substr($1,1,10)}')"
elif command -v shasum >/dev/null 2>&1; then
  URL_HASH="$(echo "$URL" | shasum -a 256 | awk '{print substr($1,1,10)}')"
else
  echo "ERROR: No SHA256 tool found (sha256sum/gsha256sum/shasum). Please install coreutils or ensure shasum is available." >&2
  exit 1
fi
REAL_DOWNLOAD_DESTINATION="$DOWNLOAD_DESTINATION.$URL_HASH"
if test -e "$REAL_DOWNLOAD_DESTINATION"; then
  echo "Download already exists for: '$DOWNLOAD_DESTINATION'  Skipping..."
else
  echo "Downloading ${URL} --> ${DOWNLOAD_DESTINATION}"
  mkdir -p "$(dirname "$DOWNLOAD_DESTINATION")"
  TMP_DOWNLOAD_DESTINATION="$(mktemp "$REAL_DOWNLOAD_DESTINATION.XXXXX")"
  curl --fail -sSL "$URL" >"$TMP_DOWNLOAD_DESTINATION"
  mv "$TMP_DOWNLOAD_DESTINATION" "$REAL_DOWNLOAD_DESTINATION"
fi

ln -s -f "$(basename "$REAL_DOWNLOAD_DESTINATION")" "$DOWNLOAD_DESTINATION"
