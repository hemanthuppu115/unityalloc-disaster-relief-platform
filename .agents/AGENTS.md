# Agent Directives & Behavioral Rules

## Strict Scope & Non-Disruptive Modification Rules
1. **Preserve Existing Code & Workflows**: When fixing a bug or creating a new feature, NEVER modify or alter pre-existing features, UI layouts, workflows, or business logic.
2. **Minimal Targeted Scope**: Confine all code changes strictly to fixing the specific bug or adding the exact requested feature.
3. **Explicit Permission for Workflow Modifications**: If a bug fix or new feature strictly requires modifying existing workflows, logic, or component interfaces, you MUST:
   - Explain what changes are needed and what will happen as a result.
   - Explicitly ask the user for permission before applying those workflow or structural changes.
