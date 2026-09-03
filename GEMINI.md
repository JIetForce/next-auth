See `AGENTS.md` for this repository's agent roster and its operating contract — it is authoritative.

Antigravity specifics: `invoke_subagent` is asynchronous and returns the worker's id. Arm a timer on it
in the step immediately after — before the turn ends — with `schedule(DurationSeconds: 180,
TimerCondition: "<the worker's id>")`, re-armed on each wake until the worker reports; see `AGENTS.md`'s
`### Cache discipline` for why. Custom subagents are defined in `.agent/agents/<name>/agent.md`.
