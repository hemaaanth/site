/**
 * The dataset shape the /multiplexers page needs: feature categories in page
 * order, with their labels, plus the lifecycle and stage values.
 */

export const LIFECYCLES = ['active', 'slowing', 'dormant', 'abandoned', 'sunset', 'unknown']
export const STAGES = ['ga', 'beta', 'alpha', 'unknown']

export const FEATURE_CATEGORIES = [
  {
    key: 'platforms',
    label: 'Platforms',
    features: {
      macos: { label: 'macOS' },
      windows: { label: 'Windows' },
      linux: { label: 'Linux' },
      ios: { label: 'iOS' },
      android: { label: 'Android' },
      web: { label: 'Web' },
      cli: { label: 'CLI' },
      tui: { label: 'TUI' },
    },
  },
  {
    key: 'execution',
    label: 'Where agents run',
    features: {
      local: { label: 'Local machine' },
      remoteOwn: { label: 'Your own remote machine' },
      cloudManaged: { label: 'Vendor-managed cloud' },
      selfHostServer: { label: 'Self-hostable server' },
    },
  },
  {
    key: 'agents',
    label: 'Agent support',
    features: {
      claudeCode: { label: 'Claude Code' },
      codex: { label: 'Codex CLI' },
      geminiCli: { label: 'Gemini CLI' },
      copilotCli: { label: 'Copilot CLI' },
      opencode: { label: 'OpenCode' },
      cursorAgent: { label: 'Cursor agent' },
      amp: { label: 'Amp' },
      pi: { label: 'Pi' },
      anyCli: { label: 'Any CLI agent' },
      builtIn: { label: 'Built-in agent' },
    },
  },
  {
    key: 'isolation',
    label: 'Isolation & git',
    features: {
      worktrees: { label: 'Git worktrees' },
      containers: { label: 'Containers / sandboxes' },
      branchPerTask: { label: 'Branch per task' },
      diffReview: { label: 'In-app diff review' },
      prCreation: { label: 'PR creation' },
      mergeAssist: { label: 'Merge / conflict help' },
      checkpoints: { label: 'Checkpoints / rollback' },
    },
  },
  {
    key: 'orchestration',
    label: 'Orchestration',
    features: {
      parallelSessions: { label: 'Parallel sessions' },
      taskBoard: { label: 'Task board / queue' },
      subagents: { label: 'Agents spawn agents' },
      automations: { label: 'Automations' },
      notifications: { label: 'Needs-you notifications' },
      crossAgentMessaging: { label: 'Cross-agent messaging' },
      voice: { label: 'Voice control' },
    },
  },
  {
    key: 'collaboration',
    label: 'Collaboration',
    features: {
      multiUser: { label: 'Multi-user' },
      sharedSessions: { label: 'Shared sessions' },
      teamBilling: { label: 'Team plans' },
    },
  },
  {
    key: 'openness',
    label: 'Openness',
    features: {
      openSource: { label: 'Open source' },
      selfHostable: { label: 'Self-hostable end to end' },
      byoSubscription: { label: 'Bring your own subscription' },
      telemetryOptOut: { label: 'No / opt-out telemetry' },
      pluginSystem: { label: 'Plugin system' },
      apiOrMcp: { label: 'API or MCP server' },
    },
  },
]
