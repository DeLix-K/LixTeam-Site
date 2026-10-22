// What each game mode asks of the player, in the words a briefing should use. These describe how the modes really
// work; they are the same modes the career campaign launches as missions.

export const MODE_INFO = {
  'phish-or-legit': {
    name: 'Phish or Legit',
    how: ['Read each message or situation and decide whether it is genuine or a trap.', 'Say how sure you are: a confident wrong answer costs more than an honest unsure one.', 'Every answer shows the red flags you should have spotted.'],
  },
  'incident-commander': {
    name: 'Incident Commander',
    how: ['An incident is under way and every action you take costs time.', 'Watch two meters: how far the attack has got, and how much damage your own response does to the business.', 'Declare the incident contained only when it really is.'],
  },
  'cyber-detective': {
    name: 'Cyber Detective',
    how: ['Open each piece of evidence and flag only the lines that matter.', 'Good clues unlock deeper evidence.', 'Name the attack, say how sure you are, then choose the right first move.'],
  },
  'social-engineering': {
    name: 'Social Engineering Simulator',
    how: ['You are in a live conversation with someone who may not be who they say they are.', 'Choose your replies: people push back, get annoyed and change tack.', 'Two things matter: company risk (keep it low) and your relationship with the person (not every request is an attack).'],
  },
  'escape-room': {
    name: 'Cyber Escape Room',
    how: ['Solve connected security puzzles to protect the vault.', 'A wrong answer and a hint both cost you, so a careful solve outscores a rushed one.', 'Every puzzle teaches a real control.'],
  },
  'breach-room': {
    name: 'The Breach Room',
    how: ['Evidence cards from different sources are on the table.', 'Place each one in the stage of the attack it belongs to, and set aside the noise.', 'Tap an indicator to see every card it appears in, then answer the questions about what happened.'],
  },
  simulation: {
    name: 'Incident Simulation',
    how: ['Work a whole incident in stages: triage, evidence, decisions and a final report.', 'Earlier decisions change what you see later.', 'The report is graded on what you can honestly support.'],
  },
  workspace: {
    name: 'Hands-on Workspace',
    how: ['A simulated workplace with real tools: search the logs, pin evidence and act.', 'The clock keeps moving and the attacker keeps working.', 'File a report when you are done, or when the shift ends.'],
  },
};

export const modeInfo = (mode) => MODE_INFO[mode] || { name: mode, how: [] };
