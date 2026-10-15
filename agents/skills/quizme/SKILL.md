---
name: quizme
description: >-
  Quizzes the user on a finished implementation so they understand what was
  built before reviewing it. Use when the user says "quiz me" or "/quizme", or
  accepts the offer made when TDD work finishes. Asks one question at a time,
  mixing open and multiple-choice questions, checks every answer against the
  code, and ends with the gaps to look at before merge.
---

# Quizme

The goal is understanding, not a grade: after the quiz, the user should be able
to review and defend the change. Nothing is fixed or written during the quiz.

## Prepare

1. **Pick the scope.** The change the user names; otherwise the current branch
   against its base (commits plus uncommitted work), or the work just finished
   in this session. Say the scope in one line.
2. **Choose the questions.** Read the change and the code it touches, then pick
   about **5** questions (fewer for a small change) on what matters in review:
   - behavior: "what happens when…", including edge cases and failure modes
   - why: why a design choice was made, or what it protects against
   - interactions: how it meets existing code, config, callers, or installs
     that already exist
   - coverage: what is tested and what is not

   Skip trivia (names, line counts, file lists).
3. **Verify every answer first.** Confirm each answer in the code and keep its
   `file:line`. Never ask a question whose answer you haven't confirmed.

## Ask

1. Open with the scope, the number of questions, and that "skip" is fine.
2. Ask **one question per turn**, numbered ("Question 2 of 5").
3. **Mix the format.** Mostly open questions answered in the user's own words
   ("predict what happens when…", "why is X here?", "what breaks if…"), plus a
   few multiple-choice questions for quick checks. Ask multiple-choice with
   your question tool when you have one (3–4 plausible options); ask open
   questions as plain text.
4. Don't hint at the answer in the question or the option descriptions.
5. **End the turn on the question.** Nothing comes after it.

## Grade

1. Lead with a verdict: **Correct**, **Partly right**, or **Not quite**.
2. Explain in 2–4 sentences with `file:line`. For a partly right answer, name
   the part that was missing.
3. **Flag findings.** When an answer shows a gap between what the user intended
   and what the code does (the goal is X, but existing installs keep Y), report
   it as a finding, not just a miss. Note it for the summary; don't fix it.
4. Ask the next question in the same message.

## Finish

1. **Score** in one line: correct, partly right, missed.
2. **Look at before merge:** findings first, then knowledge gaps, one line each
   with `file:line`.
3. **Point to the next step:** fix the findings (as a separate change unless
   the user says otherwise), or `pr-prepare`.

## Do not

- Ask more than one question per turn, or ask about something you haven't
  verified
- Fix code or write files during the quiz
- Count a skipped question as correct
- Keep quizzing after the user says that's enough
