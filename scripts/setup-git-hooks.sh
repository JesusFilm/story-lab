#!/bin/sh
set -eu

replace=0
case "${1:-}" in
    '') ;;
    --replace) replace=1 ;;
    --help|-h)
        printf 'Usage: %s [--replace]\n' "$0"
        printf 'Enable the repository hooks; --replace opts in to replacing an existing hooks path.\n'
        exit 0
        ;;
    *)
        printf 'Usage: %s [--replace]\n' "$0" >&2
        exit 2
        ;;
esac

repo_root=$(git rev-parse --show-toplevel)
configured_hooks_path=$(git -C "$repo_root" config --get core.hooksPath || true)
effective_hooks_path=$(git -C "$repo_root" rev-parse --git-path hooks)

# Treat an absolute or relative spelling of this repository's hooks directory
# as already configured. Git normally returns the configured spelling here.
case "$effective_hooks_path" in
    .githooks|"$repo_root/.githooks")
        printf 'Git hooks already enabled from %s/.githooks\n' "$repo_root"
        exit 0
        ;;
esac

case "$effective_hooks_path" in
    /*) hooks_dir=$effective_hooks_path ;;
    *) hooks_dir=$repo_root/$effective_hooks_path ;;
esac

if [ -n "$configured_hooks_path" ]; then
    if [ "$replace" -ne 1 ]; then
        printf 'WARNING: core.hooksPath is already set to %s.\n' "$configured_hooks_path" >&2
        printf 'Refusing to replace that custom hooks path; rerun with --replace after reviewing it.\n' >&2
        exit 1
    fi
    printf 'WARNING: replacing custom core.hooksPath %s because --replace was provided.\n' "$configured_hooks_path" >&2
else
    existing_hook=$(find "$hooks_dir" -maxdepth 1 \( -type f -o -type l \) ! -name '*.sample' -print -quit 2>/dev/null || true)
    if [ -n "$existing_hook" ]; then
        if [ "$replace" -ne 1 ]; then
            printf 'WARNING: existing custom hook found at %s.\n' "$existing_hook" >&2
            printf 'Refusing to disable it; rerun with --replace after reviewing it.\n' >&2
            exit 1
        fi
        printf 'WARNING: replacing the existing hook set because --replace was provided.\n' >&2
    fi
fi

git -C "$repo_root" config core.hooksPath .githooks
printf 'Git hooks enabled from %s/.githooks\n' "$repo_root"
