#!/bin/zsh
# Records every word, meaning and example sentence as small audio files using the Mac's built-in voices.
# Run from anywhere inside the repo:   ./audio/make-audio.sh
# Options:  ZH_VOICE="Tingting" EN_VOICE="Samantha" JOBS=6 ./audio/make-audio.sh
# Re-running only records clips that are missing (e.g. after new lessons are added).
set -e
cd "${0:A:h}/.."
command -v say >/dev/null || { echo "This script needs macOS (the 'say' command)."; exit 1; }

ZH_VOICE=${ZH_VOICE:-$(say -v '?' | grep -E 'zh_CN' | head -1 | sed -E 's/ {2,}.*//')}
EN_VOICE=${EN_VOICE:-Samantha}
JOBS=${JOBS:-6}
[[ -z "$ZH_VOICE" ]] && { echo "No Mandarin (zh_CN) voice installed. Add one in System Settings → Accessibility → Spoken Content → System Voice → Manage Voices."; exit 1; }
echo "Chinese voice: $ZH_VOICE   ·   English voice: $EN_VOICE"

mkdir -p audio/clips
osascript -l JavaScript audio/build-list.js "$PWD"
total=$(wc -l < audio/list.tsv | tr -d ' ')
echo "Recording $total clips with $JOBS parallel jobs (already-recorded ones are skipped)…"

record_shard() {
  local shard=$1 tmp
  tmp=$(mktemp -d)
  awk -v s="$shard" -v n="$JOBS" '(NR-1)%n==s' audio/list.tsv | while IFS=$'\t' read -r file lang text; do
    local out="audio/clips/$file"
    [[ -s "$out" ]] && continue
    printf '%s' "$text" > "$tmp/t.txt"
    if [[ "$lang" == "zh" ]]; then say -v "$ZH_VOICE" -r 165 -f "$tmp/t.txt" -o "$tmp/c.aiff" || continue
    else                          say -v "$EN_VOICE" -f "$tmp/t.txt" -o "$tmp/c.aiff" || continue; fi
    afconvert -f m4af -d aac -b 32000 "$tmp/c.aiff" "$out" 2>/dev/null || afconvert -f m4af -d aac "$tmp/c.aiff" "$out" || echo "  could not convert: $text"
  done
  rm -rf "$tmp"
}

pids=()
for (( s=0; s<JOBS; s++ )); do record_shard $s & pids+=($!); done
while true; do
  alive=0; for p in $pids; do kill -0 $p 2>/dev/null && alive=1; done
  printf "\r  %s / %s recorded" "$(ls audio/clips | wc -l | tr -d ' ')" "$total"
  (( alive )) || break
  sleep 2
done
wait
printf "\r  %s / %s recorded\n" "$(ls audio/clips | wc -l | tr -d ' ')" "$total"
du -sh audio/clips | awk '{print "Size: "$1}'
echo
echo "Done. Publish it with:"
echo "  git add audio && git commit -m 'Recorded audio' && git push"
