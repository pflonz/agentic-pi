# Issues/Work Log Template

This file demonstrates the format for logging work completed on tickets. Keep it simple - just enough to remember what was done. Full details live in Jira/GitHub.

## Format

Each entry should include:
- Date (YYYY-MM-DD)
- Ticket ID
- Brief description (1-2 lines)
- URL to ticket (if available)
- Status (optional: completed, in-progress, blocked)

Use bullet lists for simplicity. This is NOT a replacement for your ticket system - it's a quick reference log.

## Example Entries

### 2026-03-16 - CCN-24097: DM MC FSM low-voltage detection fix
- **Status**: Completed
- **Description**: Fixed unreliable detection of non-closed main contactor at low battery voltages.
- **URL**: https://taskbox.karcher.com/browse/CCN-24097
- **Notes**: See common_src changelog entry with commit reference for implementation details.

### 2026-03-11 - CCN-24073: SafeInput noise floor adjustment
- **Status**: Completed
- **Description**: Raised SafeInput noise floor to handle elevated zero-level at high ambient temperature.
- **URL**: https://taskbox.karcher.com/browse/CCN-24073
- **Notes**: Calibrated for behavior observed around 80 C ambient conditions.

### 2026-03-02 - CCN-23707: Runtime-configurable drive module presence
- **Status**: Completed
- **Description**: Added runtime configurability of drive module presence based on hardware number.
- **URL**: https://taskbox.karcher.com/browse/CCN-23707
- **Notes**: Helps align behavior across machine variants with different hardware configurations.

### 2026-02-24 - CCN-23558: Event ID generation script update
- **Status**: Completed
- **Description**: Extended generate_event_id.py with validation and auto-calculation for event/system error mapping.
- **URL**: https://taskbox.karcher.com/browse/CCN-23558
- **Notes**: Includes uniqueness checks and HMI display value generation rules.

### 2026-01-22 - CCN-23317: CANopen PDU request queue implementation
- **Status**: Completed
- **Description**: Introduced QueueingCanopenManager to process CANopen requests in main scheduler instead of CAN ISR.
- **URL**: https://taskbox.karcher.com/browse/CCN-23317
- **Notes**: Reduces ISR load and improves scheduling control of CANopen processing.

## Alternative Format (Grouped by Week)

### Week of 2026-03-16

**Completed:**
- CCN-24097: DM MC FSM low-voltage detection fix -> https://taskbox.karcher.com/browse/CCN-24097
- CCN-24073: SafeInput noise floor adjustment -> https://taskbox.karcher.com/browse/CCN-24073

**In Progress:**
- CCN-24095: IsBrushBAssembled correction follow-up validation

### Week of 2026-02-24

**Completed:**
- CCN-23707: Runtime-configurable DM presence -> https://taskbox.karcher.com/browse/CCN-23707
- CCN-23558: Event ID generation script update -> https://taskbox.karcher.com/browse/CCN-23558

**Blocked:**
- CCN-24000: Optional nodes software integrity testbench verification pending

## Tips

- Keep descriptions brief (1-2 lines max)
- Always include ticket URL for easy reference
- Update status if work gets blocked or resumed
- Optional: Group by week or sprint for better organization
- Don't duplicate ticket details - link to source of truth
- Clean out very old entries periodically (3+ months)
- Include both Jira and GitHub tickets as appropriate
