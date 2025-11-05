

// Make all Classes in Mainmenu Selection


API_URI = "https://anwesenheits-avzr716yb-daniels-projects-153cc280.vercel.app/api/v1/"

let classes = null

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

    // const testDialogue = new Dialogue("Hi", ["ja", "nein"])
    // const diaRes = await testDialogue.showDialogue()
    // console.log(diaRes)
    

    await fetchApiData()


    document.querySelector(".mainbutton").addEventListener("click", pressMainbutton)

    

    document.querySelector("button.back").addEventListener("click", () =>
    {
        openedSession = {}
        window.location.reload()
    })

    document.querySelector("button.saveSessionEdits").addEventListener("click", saveEdits)

    document.querySelector(".addProfile button").addEventListener("click", addProfileToSession)
}


async function fetchApiData()
{
    const res = await fetch(API_URI + "classes")  
    classes = await res.json()

    // Search for Mainclass-Object
    const select = document.getElementById("mainclass");

    // Append each Item from "Classes" to mainclass-object
    classes.forEach(cls => {
        const option = document.createElement("option");
        option.value, option.textContent = cls, cls;
        select.appendChild(option);
    })
}




async function pressMainbutton()
{
    if (document.getElementById("maindate").value == "") {
        alert("Please enter a valid date.")
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
            window.alert()
            (new Dialogue("Ein Netzwerkfehler ist aufgetreten.", ["Ok"])).showDialogue()
            break
    }
}


async function checkSession(date, className)
{
    const res = await fetch(API_URI + "check-session", {
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
    document.getElementById("sessionName").textContent = className + "; " + formatDate(date)

    // console.log(`get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`)
    let res = await fetch(API_URI + `get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`) // Check if Session exists
    if(!res.ok) console.error("Session not found")

    // add Profiles to list

    const session = await res.json()
    // console.log(session)

    session.members.forEach(profile =>
    {
        addProfileRow(profile.name, profile.status)
    })

    document.querySelector("#mainScr").style.display = "none"
    document.querySelector(".editSession").style.display = "initial"

    // desv
    document.querySelector(".inputSessionInfo").value = session.info
    
    openedSession.className = className
    openedSession.sessionDate = formatDate(date)
}


async function createSession(date, className)
{
    await fetch(API_URI + "create-session", {
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
    newLi.innerText = name
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
    

    document.querySelectorAll(".profiles_list li").forEach(li => {
        if(li.innerText == profileName)
        {
            alert("Profil wurde bereits hinzugefügt")
            return
        }
    })

    const res = await fetch(API_URI + "check-profile?name=" + encodeURIComponent(profileName))

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
    await fetch(API_URI + "create-zw-profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            profileName: profileName
        })
    })
}


async function saveEdits()
{
    const newMembers = []

    document.querySelectorAll(".profiles_list li").forEach(li => {
        const name = li.innerText
        const status = li.querySelector("select").selectedOptions[0].textContent
        newMembers.push({name: name, status: status})
    })

    const creator = document.querySelector(".inputSessionCreator").value
    if(creator === "")
    {
        window.alert("Bitte gib einen Ersteller für die Sitzung an.")
        return
    }


    await fetch(API_URI + "edit-session", {
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
        // this.callback(result)

        resolvePromise(result)
    }
}




main()


// create-session - halb
// get-session - Todo


//TODO evtl ändern dass der name in einer Liste in einem p steht

// (sort members)
// (check session post -> get (url params))

