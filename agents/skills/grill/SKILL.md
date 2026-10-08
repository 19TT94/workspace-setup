---
name: grill
description: >-
  Interviews the user about a plan, feature, or design until both sides share
  one understanding of it, before any tickets or code. Use when the user says
  "grill me", wants to pressure-test an idea, or brings a request that is too
  fuzzy to plan. Asks a few questions per round, each with a recommended
  answer, and looks up facts instead of asking about them.
---

# Grill

Adapted from Matt Pocock's `grill-me`, `grilling`, and `domain-modeling`
skills (https://github.com/mattpocock/skills, MIT). The goal is a shared
understanding of the plan, not code: nothing gets built or written during the
interview.

## Interview

1. **Map the decisions.** Sketch the decisions the plan depends on as a tree:
   a decision whose answer shapes others comes first.
2. **Ask in rounds.** Each round asks only the open decisions whose
   prerequisites are settled, at most **3** per round, numbered. A question
   that depends on another question still open in the same round waits for a
   later round. Wait for the answers before the next round.
3. **Recommend an answer.** Every question carries your recommendation and is
   phrased so that "yes" accepts it.
4. **Look it up, don't ask.** Facts that live in the code, docs, config, or
   `~/.config/agent-templates/OPINIONS.md` are read, not asked. Ask only about
   decisions. Base recommendations on those opinions and say when an answer
   would go against one.
5. **Press on weak spots.** Push back on vague answers, and surface the
   trade-offs, edge cases, failure modes, and scope boundaries the user hasn't
   covered. Be rigorous, not adversarial:
   - **Check claims against the code.** When the user says how something
     works, confirm it in the code and call out contradictions ("the code
     cancels whole orders, but you said partial cancellation is possible;
     which is right?").
   - **Sharpen fuzzy terms.** When a word could mean two things, ask which
     ("by 'account', the customer or the user?") and use the agreed term from
     then on.
   - **Test with scenarios.** Invent concrete edge cases that force the
     boundaries between concepts to be precise.
6. **Stop when it's clear.** End when the open decisions are settled, or as
   soon as the user says that's enough.

### Round format

```markdown
**1. Where should exports run?**
Synchronously in the request, or as a background job with a download link?
➡️ Recommended: background job — large accounts would time out otherwise.

---

**2. …**
```

## Finish

1. **Summarize** in a few lines: decisions made, open questions, and what is
   out of scope. Ask: "Is this our shared understanding?"
2. **Offer what to keep.** Nothing is written by default; ask which of these
   the user wants:
   - Durable, general preferences → `OPINIONS.md`, following the global
     rules for adding opinions.
   - Project decisions or terms → the project's existing docs (README,
     `docs/`, an existing decision-record folder). Propose a new decision
     record or glossary only for a hard-to-reverse, surprising trade-off, and
     only with agreement.
3. **Point to the next step:** `feature-planning` for tickets, or test
   scenarios if building starts now.

## Do not

- Ask more than 3 questions in a round, or ask about something you can look up
- Write code, tickets, or files before the summary is confirmed
- Introduce new doc conventions (glossary files, ADR folders) without agreement
- Keep grilling after the user says that's enough
