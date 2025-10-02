// sms_generator.js - Complete File

// ID fyrir dropdown listana
const DEPENDENT_DROPDOWN_IDS = [
    'location',
    'when',
    'weekday',
    'status'
];

// Logo sem birtist í smástund og hverfur í byrjun

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("logo-overlay").classList.add("fade-out");
    setTimeout(() => {
      document.getElementById("logo-overlay").style.display = "none";
    }, 1500); // match transition time
  }, 2000); // how long logo stays visible
});

/**
 * Sets the 'manualTime' input field to the current local time (HH:MM) 24h format.
 */
function setCurrentTime() {
    const now = new Date();
    
    // Get hours and minutes, ensuring leading zeros (24-hour format)
   // These ensure 24-hour format, e.g., 15:37, NOT 03:37 PM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime24h = `${hours}:${minutes}`;
    document.getElementById('manualTime').value = currentTime24h;
    generateSMS();
}

/**
 * Handles the change event for the primary 'avalancheLevel' dropdown.
 * Enables/disables other dropdowns and calls the message generator.
 */
function handleLevelChange() {
    const level = document.getElementById('avalancheLevel').value;
    const isLevelSelected = level !== '';
    
    // Base inputs (location, when, weekday) are unlocked if a level is selected AND it's NOT "Fyrsta stig"
    const shouldUnlockBaseInputs = isLevelSelected && level !== "Fyrsta stig";

    // 'status' nýtist bara á þessum þrepum.
    const requiresStatus = (
        level === "Þriðja stig" || 
        level === "Fjórða stigi aflýst" || 
        level === "Þriðja stigi aflýst"
    );

    // Loop through all dependent dropdowns
    DEPENDENT_DROPDOWN_IDS.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;
        
        if (id === 'status') {
            // Special rule for 'status' dropdown
            element.disabled = !requiresStatus;
        } else {
            // General rule for 'location', 'when', and 'weekday'
            element.disabled = !shouldUnlockBaseInputs;
        }
    });

    // Generate the SMS for any valid selection
    if (isLevelSelected) {
        generateSMS();
    } else {
        // Reset output if the initial 'Velja stig' default is selected
        document.getElementById('sms-output').textContent = "Vinsamlegast veljið stig viðvörunar til að byrja.";
    }
}


/**
 * Function to translate the nested Excel IF statement into JavaScript logic.
 * The core logic relies on the Snjóflóðastig (C5) value.
 */
function generateSMS() {
    // 1. Get input values from the webpage
    const getInput = (id) => document.getElementById(id).value;

    const level = getInput('avalancheLevel');
    const loc = getInput('location');
    const whenTime = getInput('when');
    const day = getInput('weekday');
    const status = getInput('status');
    // Get the time directly from the input field
    const currentTime = getInput('manualTime'); 

    let finalMessage = "";

    // 2. Translate the nested IF logic into a SWITCH statement
    switch (level) {
        case "Fyrsta stig":
            finalMessage = "Ekkert sms sent á fyrsta stigi";
            break;

        case "Annað stig":
            // Note: Does not use 'currentTime' or 'status'
            finalMessage = `Frá Vegagerðinni: B: ${loc}: Snjóflóðahætta er möguleg  ${whenTime} ${day}.`;
            break;

        case "Þriðja stig":
            // Uses all inputs except 'status' is appended separately
            finalMessage = `Frá Vegagerðinni: C: ${loc}: Snjóflóð: Óvissustigi er lýst yfir ${whenTime} ${day} kl. ${currentTime}. ${status}`;
            break;

        case "Fjórða stig":
            // Ignores 'status' selection and hardcodes 'Lokað'
            finalMessage = `Frá Vegagerðinni: D: ${loc}: Snjóflóð: Hættustigi er lýst yfir ${whenTime} ${day} kl. ${currentTime} Lokað.`;
            break;

        case "Fjórða stigi aflýst":
            finalMessage = `Frá Vegagerðinni: D: ${loc}: Snjóflóð: Hættustigi er aflýst ${whenTime} ${day} kl. ${currentTime}. ${status}`;
            break;
            
        case "Þriðja stigi aflýst":
            finalMessage = `Frá Vegagerðinni: D: ${loc}: Snjóflóð: Óvissustigi er aflýst ${whenTime} ${day} kl. ${currentTime}. ${status}`;
            break;

        default:
            finalMessage = "Villa: Óþekkt snjóflóðastig. Vinsamlegast athugið valinn valmöguleika.";
    }

    // 3. Update the HTML output area
    document.getElementById('sms-output').textContent = finalMessage;

    // 4. Ensure the copy button has the correct text after generation (if it was changed)
    const copyButton = document.getElementById('copy-button');
    if (copyButton && copyButton.textContent !== "Afrita texta á klippiborð 📋") {
        copyButton.textContent = "Afrita texta á klippiborð 📋";
    }
}

/**
 * Function to copy the text content from the output area to the clipboard.
 */
function copySMS() {
    // 1. Get the text content from the output paragraph
    const smsText = document.getElementById('sms-output').textContent;
    const copyButton = document.getElementById('copy-button');

    // 2. Use the modern Clipboard API to write the text
    navigator.clipboard.writeText(smsText)
        .then(() => {
            // Success: Provide visual confirmation to the user
            alert("Texti afritaður á klippiborð!");
            
            // Temporarily change the button text for better feedback
            if (copyButton) {
                copyButton.textContent = "Afritað! ✅";
                
                // Change it back after a short delay
                setTimeout(() => {
                    copyButton.textContent = "Afrita texta á klippiborð 📋";
                }, 1500);
            }
        })
        .catch(err => {
            // Error: This might happen if the page is not secure (not HTTPS)
            console.error('Could not copy text: ', err);
            alert("Villa: Gat ekki afritað texta. Vinsamlegast veljið textann handvirkt.");
        });
}

// Ensure the initial state of the dropdowns is set on page load
window.onload = handleLevelChange;
