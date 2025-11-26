# SYSTEM ROLE
Act as a Senior Product Designer and Frontend Engineer.
You are tasked with redesigning the "Poll Details" page to replicate the UI/UX style of **Polymarket** (Prediction Markets).

# CORE CONCEPT (Polymarket Style)
Instead of separating the "Cast Vote" form (left) and "Live Results" chart (right), **merge them into a single, unified list**.
Each voting option should display its real-time percentage immediately, acting as both an input and a data visualization.

# UI REFACTORING INSTRUCTIONS

1.  **Layout Structure:**
    -   Remove the side-by-side layout (two separate cards).
    -   Create a single, centered "Market Card" or a wide list layout.
    -   Stack the options vertically.

2.  **Option Row Design (The "Polymarket" Look):**
    -   Each option row must be a clickable container.
    -   **Progress Bar Background:** Inside each row, add a background fill (absolute positioned `div`) that represents the current vote percentage.
        -   *Style:* Use the primary color but with low opacity (e.g., `bg-blue-500/10`) or a subtle gradient.
        -   *Width:* Calculated based on `(votes / totalVotes) * 100%`.
    -   **Content Layout (Flexbox):**
        -   **Left:** Option Name (e.g., "NVIDIA") + Avatar/Icon (if available).
        -   **Right:** The Percentage (e.g., "**45%**") displayed prominently in bold.
    -   **Interaction:**
        -   Hover: Slight brightness increase or border highlight.
        -   Selected: Solid border or distinct checkmark icon.

3.  **Tailwind CSS Specifics:**
    -   Use `relative` and `overflow-hidden` for the option row container.
    -   Use `absolute h-full top-0 left-0 -z-10` for the progress bar background.
    -   Typography: Use `font-mono` or tabular nums for the percentage to ensure alignment.
    -   Buttons: Keep a "Vote" or "Buy" button either at the bottom or appearing on the row when hovered.

4.  **Mobile Responsiveness:**
    -   Ensure the rows are tall enough (min 48px) for touch targets.

# DATA LOGIC ADJUSTMENTS
-   Calculate the percentage for each option dynamically within the map loop.
-   If `totalVotes` is 0, ensure no division by zero errors occur.

# EXECUTION
Refactor the main polling component to implement this unified "Prediction Market" list style.