

// Make all Classes in Mainmenu Selection


API_URI = "http://localhost:3000/"

let classes = null

let openedSession = {
    // className,
    // sessionDate
}

async function main()
{
    await fetchApiData()


    document.querySelector(".createSessionNo").addEventListener("click", () =>
    {
        document.querySelector(".popup_background").style.display = "none"
    })

    document.querySelector(".createSessionYes").addEventListener("click", async () =>
    {
        document.querySelector(".popup_background").style.display = "none"
        const date = new Date(document.querySelector("#maindate").value)
        const className = document.querySelector("#mainclass").value
        await openSession(date, className)
    })

    document.querySelector("button.back").addEventListener("click", () =>
    {
        openedSession = {}
        window.location.reload()
    })

    document.querySelector("button.saveSessionEdits").addEventListener("click", saveEdits)
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


// Press Mainbutton

async function pressMainbutton()
{
    if (document.getElementById("maindate").value == "") {
        alert("Please enter a valid date.")
        return
    }

    const date = new Date(document.querySelector("#maindate").value)
    const className = document.querySelector("#mainclass").value
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
    
    createPopup(json.errorCode)
}


function createPopup(code)
{
    switch(code)
    {
        case 0:
            document.getElementById("popup_content").textContent = "Möchtest du diese Session neu erstellen?"
            break;
        case 2: 
            document.getElementById("popup_content").textContent = "Möchtest du die Sitzung bearbeiten?"
            break;
        case 1:
            window.alert("Die Sitzung existiert bereits in der Datenbank und kann nicht bearbeitet werden.")
            break
        default:
            window.alert("Error while identifying existence of session.")
            break
    }

    document.getElementById("popup_background").style.display = "flex"
}


async function openSession(date, className)
{
    document.getElementById("seesionName").textContent = className + "; " + formatDate(date)

    // console.log(`get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`)
    let res = await fetch(API_URI + `get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`) // Check if Session exists
    if(res.status !== 200) // session does not exist, create it
    {
        await createSession(date, className)
        res = await fetch(API_URI + `get-session?sessionClass=${encodeURIComponent(className)}&sessionDate=${encodeURIComponent(formatDate(date))}`)
    }

    // ok, add Profiles to list

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


main()


// create-session - halb
// get-session - Todo


//TODO evtl ändern dass der name in einer Liste in einem p steht
