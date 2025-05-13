document.addEventListener('DOMContentLoaded', () => {
    const typingTextElement = document.getElementById('typing-text');
    const cursorElement = typingTextElement.querySelector('.cursor'); // Get the cursor span

    // === CUSTOMIZE TEXT STATEMENTS BELOW ===
    const statements = [
        "Initializing system...",
        "Loading Dillzilla modules...",
        "Repository access granted.",
        "Welcome, user!",
        "Browse the archives below."
        // Add more statements as needed
    ];
    // === END CUSTOMIZE TEXT STATEMENTS ===

    let statementIndex = 0;
    let charIndex = 0;
    const typingSpeed = 80; // Milliseconds per character
    const pauseBetweenStatements = 2500; // Milliseconds pause

    function typeWriter() {
        if (statementIndex < statements.length) {
            const currentStatement = statements[statementIndex];
            if (charIndex < currentStatement.length) {
                // Insert character before the cursor
                cursorElement.insertAdjacentText('beforebegin', currentStatement.charAt(charIndex));
                charIndex++;
                setTimeout(typeWriter, typingSpeed);
            } else {
                // Statement finished, pause then start next one
                setTimeout(() => {
                    statementIndex++;
                    charIndex = 0;
                    // Clear previous text content (excluding the cursor span)
                    typingTextElement.textContent = '';
                    typingTextElement.appendChild(cursorElement); // Re-append cursor

                    // If we looped through all statements, restart from the beginning (optional)
                    if (statementIndex >= statements.length) {
                         statementIndex = 0; // Loop back
                    }

                    typeWriter(); // Start typing the next statement
                }, pauseBetweenStatements);
            }
        }
    }

    // Start the typing effect when the page loads
    typeWriter();
});