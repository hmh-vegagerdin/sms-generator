// sms_generator.js

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

/*  Fúnksjón til að stimpla inn tíma í textann í 24h formati. */
function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime24h = `${hours}:${minutes}`;
    document.getElementById('manualTime').value = currentTime24h;
    generateSMS();
}

/* Fúnksjón til að læsa listum þar til þrep er valið. */
function handleLevelChange() {
    const level = document.getElementById('avalancheLevel').value;
    const isLevelSelected = level !== '';
    
/* Input listar eru læstir (staðsetning, hvenær, vikurdagur) opna ef þrep er valið og það er ekki "fyrsta stig" */
    const shouldUnlockBaseInputs = isLevelSelected && level !== "Fyrsta stig";

    // 'staða' opnar bara á þessum þrepum.
    const requiresStatus = (
        level === "Þriðja stig" || 
        level === "Fjórða stigi aflýst" || 
        level === "Þriðja stigi aflýst"
    );

    // Lúppa sem les gegnum listana og býr til setninguna
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


/* Þar sem þetta er upphaflega logic úr excel skjali þá er þessi fúnksjón til að þýða þau gögn. */
function generateSMS() {
    // 1. fá gögn af val-síðunni
    const getInput = (id) => document.getElementById(id).value;

    const level = getInput('avalancheLevel');
    const loc = getInput('location');
    const whenTime = getInput('when');
    const day = getInput('weekday');
    const status = getInput('status');
    // Get the time directly from the input field
    const currentTime = getInput('manualTime'); 

    let finalMessage = "";

    // 2. Þýða IF úr excel í switch
    switch (level) {
        case "Fyrsta stig":
            finalMessage = "Ekkert sms sent á fyrsta stigi";
            break;

        case "Annað stig":
            // Notar ekki tíma eða stöðu valmöguleikana
            finalMessage = `Frá Vegagerðinni: B: ${loc}: Snjóflóðahætta er möguleg  ${whenTime} ${day}.`;
            break;

        case "Þriðja stig":
            // Allir möguleikar opnir en staða er valkvætt að nota.
            finalMessage = `Frá Vegagerðinni: C: ${loc}: Snjóflóð: Óvissustigi er lýst yfir ${whenTime} ${day} kl. ${currentTime}. ${status}`;
            break;

        case "Fjórða stig":
            // Hunsar stöðu og læsir inn Lokað 
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

    // 3. Uppfæra html lokatexta
    document.getElementById('sms-output').textContent = finalMessage;

    // 4. Afstemming að afritunartakkinn sé með réttan texta
    const copyButton = document.getElementById('copy-button');
    if (copyButton && copyButton.textContent !== "Afrita texta á klippiborð 📋") {
        copyButton.textContent = "Afrita texta á klippiborð 📋";
    }
}

/* Fúnksjón til að afrita texta á klippiborð í windows */
function copySMS() {
    // 1. Sækja texta
    const smsText = document.getElementById('sms-output').textContent;
    const copyButton = document.getElementById('copy-button');

    // 2. Nota klippiborð API til að skrifa textann
    navigator.clipboard.writeText(smsText)
        .then(() => {
            // Tókst: staðfestingartexti
            alert("Þessi texti hefur verið afritaður og sendur á makann þinn.");
            
            // Breyta takkatexta tímabundið (1.5 sekúndur)
            if (copyButton) {
                copyButton.textContent = "Afritað! ✅";
                setTimeout(() => {
                copyButton.textContent = "Afrita texta á klippiborð 📋";
                }, 1500);
            }
        })
        .catch(err => {
            // Error: This might happen if the page is not secure (not HTTPS)
            console.error('Could not copy text: ', err);
            alert("Auli! Gat ekki afritað texta. Vinsamlegast veljið textann handvirkt.");
        });
}

// Passa að upphafsstaða komi á þegar síða er hlaðin aftur
window.onload = handleLevelChange;
