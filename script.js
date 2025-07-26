const people = {};
const AVATARS = [
    "images/crisphan.png",
    "images/hieuthuhai.png",
    "images/j97.png",
    "images/ldbaolam.png",
    "images/mtp.png",
    "images/mytam.png",
    "images/thienan.png",
    "images/tranthanh.png",
    "images/truonggiang.png",
    "images/thuytien.png",
];
let availableAvatars = [...AVATARS];

function addPerson() {
    const nameInput = document.getElementById("personName");
    const displayName = nameInput.value.trim();
    const key = normalizeName(displayName);
    const messageEl = document.getElementById("message");

    messageEl.textContent = "";

    if (!displayName) {
        messageEl.textContent = "Please enter a valid name.";
        nameInput.value = "";
        return;
    }

    if (people[key] !== undefined) {
        messageEl.textContent = `The name "${displayName}" already exists.`;
        nameInput.value = "";
        return;
    }

    people[key] = { name: displayName, amount: 0, avatar: getRandomAvatar() };

    renderPerson(key);
    updateTotalPerson();
    nameInput.value = "";
}

function normalizeName(name) {
    return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getRandomAvatar() {
    if (availableAvatars.length === 0) {
        availableAvatars = [...AVATARS];
    }

    const index = Math.floor(Math.random() * availableAvatars.length);
    const avatar = availableAvatars[index];
    availableAvatars.splice(index, 1);

    return avatar;
}

function renderPerson(key) {
    const container = document.getElementById("peopleList");

    const personDiv = document.createElement("div");
    personDiv.className = "person-card";
    personDiv.id = `person-${key}`;

    const person = people[key];

    personDiv.innerHTML = `
        <div class="header">
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${person.avatar}" alt="avatar" class="avatar-image">
                <h3>${person.name}</h3>
            </div>
            <button class="delete-button" onclick="deletePerson('${key}')">🗑️ Delete</button>
        </div>

        <p>Current Total: <span class="amount-display" id="amount-${key}">0</span></p>

        <div class="quick-buttons">
            ${[5, 10, 20, 30].map(val => `
                <button onclick="adjustAmount('${key}', ${val})">+${val}</button>
                <button onclick="adjustAmount('${key}', -${val})">-${val}</button>
            `).join('')}
        </div>

        <div style="margin-top: 10px;">
            <input type="number" id="input-${key}" placeholder="Enter amount">
            <button onclick="updateAmount('${key}', 'add')">+</button>
            <button onclick="updateAmount('${key}', 'subtract')">-</button>
            <p class="error-message" id="message-${key}"></p>
        </div>
    `;
    container.appendChild(personDiv);
}

function updateAmount(key, operation) {
    const input = document.getElementById(`input-${key}`);
    const value = parseFloat(input.value);
    const messageEl = document.getElementById(`message-${key}`);

    messageEl.textContent = "";

    if (isNaN(value)) {
        messageEl.textContent = "Please enter a valid number.";
        return;
    }

    const delta = operation === "subtract" ? -value : value;
    const previousAmount = people[key].amount;

    people[key].amount += delta;

    const amountEl = document.getElementById(`amount-${key}`);
    amountEl.innerHTML = `
        <span style="color:#999; font-size:14px;">Prev: ${previousAmount}</span>
        <span style="margin: 0 8px;">→</span>
        <span style="color:#27ae60; font-size:16px; font-weight:bold;">Now: ${people[key].amount}</span>
    `;

    input.value = "";
}

function adjustAmount(key, amount) {
    const previousAmount = people[key].amount;
    people[key].amount += amount;

    const amountEl = document.getElementById(`amount-${key}`);
    amountEl.innerHTML = `
        <span style="color:#999; font-size:14px;">Prev: ${previousAmount}</span>
        <span style="margin: 0 8px;">→</span>
        <span style="color:#27ae60; font-size:16px; font-weight:bold;">Now: ${people[key].amount}</span>
    `;
}


function deletePerson(key) {
    showConfirm(`Are you sure you want to delete "${people[key].name}"?`, function (confirmed) {
        if (confirmed) {
            delete people[key];
            const element = document.getElementById(`person-${key}`);
            if (element) element.remove();
            updateTotalPerson();
        }
    });
}

function deleteAllPeople() {
    showConfirm("Are you sure you want to delete ALL people?", function(confirmed) {
        if (!confirmed) return;

        for (let key in people) {
            delete people[key];
        }
        document.getElementById("peopleList").innerHTML = "";
        updateTotalPerson();
        availableAvatars = [...AVATARS];
        localStorage.removeItem("peopleData");
    });
}

function updateTotalPerson() {
    const count = Object.keys(people).length;
    document.getElementById("totalPerson").textContent = `Total of all: ${count}`;
}

function saveData() {
    localStorage.setItem("peopleData", JSON.stringify(people));
    showConfirm("✅ Data saved successfully!");
}

function loadData() {
    const saved = JSON.parse(localStorage.getItem("peopleData"));
    if (!saved || Object.keys(saved).length === 0) {
        showConfirm("⚠️ No saved data found!");
        return;
    }

    Object.keys(people).forEach(key => delete people[key]);
    document.getElementById("peopleList").innerHTML = "";

    Object.keys(saved).forEach(key => {
        
        people[key] = saved[key];
        renderPerson(key);
        document.getElementById(`amount-${key}`).textContent = people[key].amount;
    });

    updateTotalPerson();
}

function exportExcel() {
    if (Object.keys(people).length === 0) {
        showConfirm("⚠️ No people data to export!");
        return;
    }
    
    const data = [["Name", "Amount"]];
    Object.values(people).forEach(p => {
        data.push([p.name, p.amount]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "People");
    XLSX.writeFile(wb, "people_data.xlsx");
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById("confirmModal");
    const messageEl = document.getElementById("modalMessage");
    const yesBtn = document.getElementById("modalYes");
    const noBtn = document.getElementById("modalNo");

    messageEl.textContent = message;
    modal.style.display = "flex";

    const cleanup = () => {
        modal.style.display = "none";
        yesBtn.onclick = null;
        noBtn.onclick = null;
    };

    if (typeof onConfirm === "function") {
        yesBtn.style.display = "inline-block";
        noBtn.style.display = "inline-block";
        yesBtn.textContent = "Yes";
        noBtn.textContent = "No";

        yesBtn.onclick = () => {
            cleanup();
            onConfirm(true);
        };

        noBtn.onclick = () => {
            cleanup();
            onConfirm(false);
        };
    } else {
        yesBtn.textContent = "OK";
        yesBtn.style.display = "inline-block";
        noBtn.style.display = "none";

        yesBtn.onclick = () => {
            cleanup();
        };
    }
}
