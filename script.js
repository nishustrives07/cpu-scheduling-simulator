let processes = [];

/* ---------- Load / Save ---------- */
window.onload = () => {
    const saved = localStorage.getItem("processes");
    if (saved) {
        processes = JSON.parse(saved);
        updateTable();
    }
};

function saveProcesses() {
    localStorage.setItem("processes", JSON.stringify(processes));
}

/* ---------- UI Helpers ---------- */
function toggleQuantum() {
    const algo = document.getElementById("algorithm").value;
    document.getElementById("quantum").style.display =
        algo === "RR" ? "inline-block" : "none";
}

/* ---------- Add Process ---------- */
function addProcess() {
    const pidEl = document.getElementById("pid");
    const arrEl = document.getElementById("arrival");
    const burstEl = document.getElementById("burst");

    const pid = pidEl.value;
    const arrival = parseInt(arrEl.value);
    const burst = parseInt(burstEl.value);

    if (!pid || isNaN(arrival) || isNaN(burst)) {
        alert("Please fill all fields correctly");
        return;
    }

    processes.push({ pid, arrival, burst });
    saveProcesses();
    updateTable();

    pidEl.value = "";
    arrEl.value = "";
    burstEl.value = "";
}

/* ---------- Clear Processes ---------- */
function clearProcesses() {
    if (!confirm("Clear all processes?")) return;

    processes = [];
    localStorage.removeItem("processes");

    document.getElementById("processTable").innerHTML = "";
    document.getElementById("result").innerHTML = "";
}

/* ---------- Table ---------- */
function updateTable() {
    const table = document.getElementById("processTable");
    table.innerHTML = "";

    processes.forEach(p => {
        table.innerHTML += `
            <tr>
                <td>${p.pid}</td>
                <td>${p.arrival}</td>
                <td>${p.burst}</td>
            </tr>
        `;
    });
}

/* ---------- Dispatcher ---------- */
function simulate() {
    if (processes.length === 0) {
        alert("No processes added");
        return;
    }

    const algo = document.getElementById("algorithm").value;

    if (algo === "FCFS") runFCFS();
    else if (algo === "SJF") runSJF();
    else runRR();
}

/* ---------- FCFS ---------- */
function runFCFS() {
    const list = [...processes].sort((a, b) => a.arrival - b.arrival);
    calculate(list);
}

/* ---------- SJF (Non-Preemptive) ---------- */
function runSJF() {
    let time = 0;
    let remaining = [...processes];
    let completed = [];

    while (remaining.length) {
        let available = remaining.filter(p => p.arrival <= time);

        if (available.length === 0) {
            time++;
            continue;
        }

        available.sort((a, b) => a.burst - b.burst);
        let job = available[0];

        time += job.burst;
        job.completion = time;

        completed.push(job);
        remaining = remaining.filter(p => p !== job);
    }

    calculate(completed);
}

/* ---------- Round Robin ---------- */
function runRR() {
    const quantum = parseInt(document.getElementById("quantum").value);
    if (isNaN(quantum) || quantum <= 0) {
        alert("Enter valid Time Quantum");
        return;
    }

    let time = 0;
    let queue = [];
    let list = processes.map(p => ({ ...p, remaining: p.burst }));

    while (list.length || queue.length) {
        list.filter(p => p.arrival <= time).forEach(p => {
            queue.push(p);
            list = list.filter(x => x !== p);
        });

        if (queue.length === 0) {
            time++;
            continue;
        }

        let p = queue.shift();
        let exec = Math.min(quantum, p.remaining);

        p.remaining -= exec;
        time += exec;

        list.filter(x => x.arrival <= time).forEach(x => {
            queue.push(x);
            list = list.filter(y => y !== x);
        });

        if (p.remaining > 0) {
            queue.push(p);
        } else {
            p.completion = time;
        }
    }

    calculate(queue.filter(p => p.completion));
}

/* ---------- Metrics ---------- */
function calculate(list) {
    let totalWT = 0, totalTAT = 0;

    let html = `
        <table>
            <tr>
                <th>PID</th>
                <th>Arrival</th>
                <th>Burst</th>
                <th>Completion</th>
                <th>Turnaround</th>
                <th>Waiting</th>
            </tr>
    `;

    list.forEach(p => {
        const tat = p.completion - p.arrival;
        const wt = tat - p.burst;

        totalWT += wt;
        totalTAT += tat;

        html += `
            <tr>
                <td>${p.pid}</td>
                <td>${p.arrival}</td>
                <td>${p.burst}</td>
                <td>${p.completion}</td>
                <td>${tat}</td>
                <td>${wt}</td>
            </tr>
        `;
    });

    html += `
        </table>
        <p><strong>Average Waiting Time:</strong> ${(totalWT / list.length).toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${(totalTAT / list.length).toFixed(2)}</p>
    `;

    document.getElementById("result").innerHTML = html;
}
