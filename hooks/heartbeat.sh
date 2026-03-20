#!/bin/bash
INPUT=$(cat)
eval "$(echo "$INPUT" | jq -r '@sh "SID=\(.session_id // "") EVT=\(.hook_event_name // "") NT=\(.notification_type // "") CWD=\(.cwd // "")"')"
[ -z "$SID" ] && exit 0

STATE=""
case "$EVT" in
  SessionEnd)        STATE="notfound" ;;
  SessionStart)      STATE="idle" ;;
  UserPromptSubmit)  STATE="running" ;;
  PostToolUse)       STATE="running" ;;
  Stop)              STATE="idle" ;;
  Notification)
    case "$NT" in
      permission_prompt) STATE="permission" ;;
      idle_prompt)       STATE="idle" ;;
    esac ;;
esac

[ -z "$STATE" ] && exit 0

SHORT_SID="${SID:0:8}"
echo "[heartbeat] ${EVT}${NT:+/$NT} → ${STATE} (session=${SHORT_SID})" >> /tmp/heartbeat.log

curl -s -X POST "http://localhost:3847/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"state\":\"$STATE\",\"pid\":$PPID,\"cwd\":\"$CWD\"}" \
  >/dev/null 2>&1 || true
