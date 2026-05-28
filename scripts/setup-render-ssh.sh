#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SSH_KEY:-}" ]]; then
    if [[ -n "${RENDER:-}" ]]; then
        echo "SSH_KEY is required on Render to install private Git dependencies." >&2
        exit 1
    fi

    echo "SSH_KEY is not set; skipping SSH setup."
    exit 0
fi

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

key_file="$HOME/.ssh/id_ecdsa"

echo "$SSH_KEY" | base64 -d > "$key_file"

chmod 600 "$key_file"

touch "$HOME/.ssh/known_hosts"
chmod 600 "$HOME/.ssh/known_hosts"
ssh-keyscan -H github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null

cat > "$HOME/.ssh/config" <<EOF
Host *
   StrictHostKeyChecking no
   UserKnownHostsFile /dev/null
   LogLevel ERROR
EOF

chmod 600 "$HOME/.ssh/config"
echo "SSH configured for GitHub private dependencies."
