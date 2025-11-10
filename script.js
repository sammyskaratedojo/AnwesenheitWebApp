API_URI = "https://anwesenheits-api.vercel.app/api/v1"
// API_URI = "http://localhost:3000"

let classes = []
let allProfileNames = []

let openedSession = {
    // className,
    // sessionDate
}

async function main()
{
    if("serviceWorker" in navigator)
    {
        navigator.serviceWorker.register("./serviceWorker.js")
    }

    await fetchApiData()


    document.querySelector(".mainbutton").addEventListener("click", pressMainbutton)

    document.querySelector("button.back").addEventListener("click", resetWindow)

    document.querySelector("button.saveSessionEdits").addEventListener("click", saveSessionUpdates)

    document.querySelector(".addProfile button").addEventListener("click", addProfileToSession)

    document.querySelector(".inputNewProfile input").addEventListener("input", genProfileSuggestion)
    
    document.querySelector(".suggestion").addEventListener("click", () =>
    {
        document.querySelector(".inputNewProfile input").value = document.querySelector(".suggestion").innerText
    })
}


async function fetchApiData()
{
    let res = await fetch(API_URI + "/classes")  
    classes = await res.json()

    // Search for Mainclass-Object
    const selectClass = document.getElementById("mainclass");

    // Append each Item from "Classes" to mainclass-object
    classes.forEach(cls => {
        const option = document.createElement("option");
        option.value, option.textContent = cls, cls;
        selectClass.appendChild(option);
    })

    res = await fetch(API_URI + "/profiles")
    
    const allProfilesJSON = await res.json()
    allProfilesJSON.forEach(p =>
    {
        allProfileNames.push(p.name)
    })
}



async function pressMainbutton()
{
    if (document.getElementById("maindate").value == "") {
        (new Dialogue("Bitte gib ein Datum an.", ["Ok"])).showDialogue()
        return
    }

    const date = new Date(document.querySelector("#maindate").value)
    const className = document.querySelector("#mainclass").value
    
    const code = await checkSession(date, className)

    let dialogueAnswer
    switch(code)
    {
        case 0:
            const createSessionDialogue = new Dialogue("Möchtest du diese Sitzung neu erstellen?", ["Ja", "Nein"])
            dialogueAnswer = await createSessionDialogue.showDialogue()
            if(dialogueAnswer === "Ja")
            {
                await createSession(date, className)
                await openSession(date, className)
            } 
            break;

        case 2: 
            const editSessionDialogue = new Dialogue("Möchtest du diese Sitzung bearbeiten?", ["Ja", "Nein"])
            dialogueAnswer = await editSessionDialogue.showDialogue()
            if(dialogueAnswer === "Ja") {
                await openSession(date, className)
            }
            break;

        case 1:
            (new Dialogue("Die Sitzung existiert bereits in der Datenbank und kann nicht bearbeitet werden.", ["Ok"])).showDialogue()
            break

        default:
            (new Dialogue("Ein Netzwerkfehler ist aufgetreten.", ["Ok"])).showDialogue()
            break
    }
}


async function checkSession(date, className)
{
    const res = await fetch(API_URI + "/check-session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
        {
            date: formatDate(date),
            className: className
            
        })
    })

    const json = await res.json()
    return json.errorCode
}


async function openSession(date, className)
{
    let res = await fetch(API_URI + `/get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`) // Check if Session exists
    if(!res.ok) return console.error("Session not found")

    const session = await res.json()

    document.getElementById("sessionName").textContent = abbrevWeekday(session.classWeekday) + " " + className + ", " + formatDate(date)

    session.members.forEach(profile =>
    {
        addProfileRow(profile.name, profile.status)
    })

    document.querySelector("#mainScr").style.display = "none"
    document.querySelector(".editSession").style.display = "initial"

    // desc
    document.querySelector(".inputSessionInfo").value = session.info
    
    openedSession.className = className
    openedSession.sessionDate = formatDate(date)
}


async function createSession(date, className)
{
    await fetch(API_URI + "/create-session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sessionDate: formatDate(date),
            className: className
        })
    })
}


function formatDate(date)
{
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}


function addProfileRow(name, status)
{
    const STATI = ["Trainer", "Assistent", "Anwesend", "Entschuldigt", "Unbekannt"]
    const profilesList = document.querySelector(".profiles_list")

    const newLi = document.createElement("li")
    const newP = document.createElement("p")
    newP.innerText = name
    newLi.appendChild(newP)
    profilesList.appendChild(newLi)
    
    const selectStatus = document.createElement("select")

    STATI.forEach((s, index) => {
        const option = document.createElement("option")
        option.value = index
        option.textContent = s
        selectStatus.appendChild(option)
        option.selected = (s === status)
    })

    selectStatus.se = status
    newLi.appendChild(selectStatus)
}


async function addProfileToSession()
{
    const profileName = document.querySelector(".addProfile input").value
    document.querySelector(".addProfile input").value = ""
    

    document.querySelectorAll(".profiles_list li")
    
    for (let name of document.querySelectorAll(".profiles_list li p")) {
        if(name.innerText == profileName)
        {
            (new Dialogue("Profil ist bereits in der Liste.", ["Ok"])).showDialogue()
            return
        }
    }

    const res = await fetch(API_URI + "/check-profile?name=" + encodeURIComponent(profileName))

    if(res.status == 404)
    {
        const dialogue = new Dialogue(`Profil '${profileName}' nicht gefunden.\nDieses Profil neu erstellen?`, ["Ja", "Nein"])
        const res = await dialogue.showDialogue()

        if(res == "Nein") return

        await createZwProfile(profileName)
    }

    
    addProfileRow(profileName, "Unbekannt")
}


async function createZwProfile(profileName)
{
    await fetch(API_URI + "/create-zw-profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            profileName: profileName
        })
    })
}


async function saveSessionUpdates()
{
    const creator = document.querySelector(".inputSessionCreator").value
    if(creator === "")
    {
        (new Dialogue("Bitte gib einen Ersteller an.", ["Ok"])).showDialogue()
        return
    }
    
    const spinnerImg = document.createElement("img")
    spinnerImg.src = "./assets/spinner.png"
    spinnerImg.classList.add("spin")
    document.querySelector("button.saveSessionEdits").innerHTML = ""
    document.querySelector("button.saveSessionEdits").appendChild(spinnerImg)


    const newMembers = []

    document.querySelectorAll(".profiles_list li").forEach(li => {
        const name = li.querySelector("p").innerText
        const status = li.querySelector("select").selectedOptions[0].textContent
        newMembers.push({name: name, status: status})
    })


    await fetch(API_URI + "/edit-session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            sessionClass: openedSession.className, 
            sessionDate: openedSession.sessionDate,
            sessionInfo: document.querySelector(".inputSessionInfo").value,
            members: newMembers,
            creator: creator,
        })
    })

    document.querySelector("button.saveSessionEdits").removeChild(spinnerImg)
    document.querySelector("button.saveSessionEdits").innerHTML = "Speichern"
}


function genProfileSuggestion()
{
    const currProfileInput = document.querySelector(".inputNewProfile input").value
    if(currProfileInput === "") return document.querySelector(".suggestion").innerText = ""

    for(let i = 0; i < allProfileNames.length; i++)
    {
        const p = allProfileNames[i]
        if(!p.toLowerCase().includes(currProfileInput.toLowerCase())) continue
        
        document.querySelector(".suggestion").innerText = p
        return
    }

    document.querySelector(".suggestion").innerText = ""
}


async function resetWindow()
{
    const resetDial = new Dialogue("Änderungen könnten nicht gespeichert sein.", ["Auf seite bleiben", "Bestätigen"])
    const res = await resetDial.showDialogue()
    if(res == "Auf seite bleiben") return
    openedSession = {}
    document.querySelector(".inputNewProfile input").value = ""
    document.querySelectorAll("input").forEach(i => {i.value = ""})
    window.location.reload()
}


function abbrevWeekday(fullDay)
{
    return fullDay.slice(0, 2) + "."
}



class Dialogue
{
    constructor(text, options)
    {
        this.options = options
        
        this.background = document.createElement("div")
        this.background.classList.add("dialogueBackground")
        this.dialogue = document.createElement("div")
        this.dialogue.classList.add("dialogue")
        const p = document.createElement("p")
        p.innerText = text
        this.dialogue.appendChild(p)
        this.dialogue.appendChild(document.createElement("div"))
    }

    showDialogue()
    {
        this.promise = new Promise((resolve, rej) =>
        {
            this.options.forEach(i => {
                const btn = document.createElement("button")
                btn.innerText = i
                btn.addEventListener("click", () => {
                    this.endDialogue(resolve, i)
                })

            this.dialogue.querySelector("div").appendChild(btn)
            })
        })
        
        document.querySelector("body").appendChild(this.background)
        document.querySelector("body").appendChild(this.dialogue)

        return this.promise
    }

    endDialogue(resolvePromise, result)
    {
        document.querySelector("body").removeChild(this.background)
        document.querySelector("body").removeChild(this.dialogue)
        resolvePromise(result)
    }
}



main()




//   TODO   \\

// evtl ändern dass der name in einer Liste in einem p steht
// (sort members)
// (check-session post -> get (url params))
