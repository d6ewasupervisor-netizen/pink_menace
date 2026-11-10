param([string]$Log, [string]$Done = '^EXIT=', [int]$CapSec = 900, [int]$PollSec = 10)
# Wait for a long run by its log, in ONE command.
#
# Why this exists: waiting with `Start-Sleep N; check` repeated in the tool loop
# trips Cline's loop detector after five identical calls and kills the task, even
# though the run underneath is fine. One call here polls every $PollSec until the
# log matches $Done or $CapSec is spent, then prints the lines that matter
# (failures, skips, the Playwright summary, the exit marker).
#
# Usage:
#   pwsh -NoProfile -File drive/scripts/wait-log.ps1 -Log drive/e2e-phase2.log
#   ... -Log <log> -Done 'passed \(' -CapSec 1200
$t = 0
while (-not (Select-String -LiteralPath $Log -Pattern $Done -Quiet -ErrorAction SilentlyContinue) -and $t -lt $CapSec) { Start-Sleep $PollSec; $t += $PollSec }
"waited=${t}s"
$progress = (Select-String -LiteralPath $Log -Pattern '^  ok |^  x |^   - ' -ErrorAction SilentlyContinue | Measure-Object).Count
"progress=${progress}"
Select-String -LiteralPath $Log -Pattern '^\s+x |^\s+-  |passed|failed|skipped|^EXIT=' | Select-Object -ExpandProperty Line
