// const { text } = require("node:stream/consumers");

// const { version } = require("react")

logs = []

steps = BigInt(0)

moc_version = {
    "extension": "core",
    "version": 0,
    "subversion":1
}

function format_response(format, data) {
    if (format.includes("{{id}}")) {
        format = format.replace("{{id}}", data.id)
    }
    if (format.includes("{{name}}")) {
        format = format.replace("{{name}}", data.name)
    }
    if (format.includes("{{cost}}")) {
        format = format.replace("{{cost}}", data.cost)
    }
    if (format.includes("{{description}}")) {
        format = format.replace("{{description}}", data.description)
    }
    if (format.includes("{{times_recieved}}")) {
        format = format.replace("{{times_recieved}}", data.times_recieved)
    }
    if (format.includes("{{reason}}")) {
        format = format.replace("{{reason}}", data.reason)
    }
    return format
}

function Generate_Perk_Display() {
    points = _Get_Current_Points()
    document.getElementById("steps").innerHTML = "CURRENT STEPS: " + points
    
    chunks = []
    logs.forEach((roll) => {
        chunk = []

        roll.forEach((perk) => {
            if (perk.success) {
                chunk.push(format_response(format_response(document.getElementById("options-format-success").value, perk)))
            } else {
                chunk.push(format_response(format_response(document.getElementById("options-format-fail").value, perk)))
            }
        })

        if (document.getElementById("options-format-reverse-check-perks").checked) {
            chunks.push(chunk.toReversed().join(document.getElementById("options-format-between-perks").value))
        } else {
            chunks.push(chunk.join(document.getElementById("options-format-between-perks").value))
        }
    })

    document.getElementById("latest-roll").value = chunks[chunks.length - 1]

    if (document.getElementById("options-format-reverse-check-rolls").checked) {
        document.getElementById("roll-logs").value = chunks.join(document.getElementById("options-format-between-rolls").value)
    } else {
        document.getElementById("roll-logs").value = chunks.toReversed().join(document.getElementById("options-format-between-rolls").value)
    }
    localStorage.setItem("save", JSON.stringify(Generate_Save_Object()));
}

var waiting = false

function Send_String_To_Wasm(message){
    var array = new Uint8Array(wasmMemory.buffer, 0, message.length+1);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message+'\0');
    for (let index = 0; index < encoded.length; index++) {
        array.set(encoded);
    }
    _test_print(array.byteOffset, message.length);
}

async function Get_Wasm_Reponse_String() {
    if (waiting) {
        console.log("still rolling");
        return true
    }

    waiting = true
    len = _Roll_Random_PRIZE()
    const array = new Uint8Array(wasmMemory.buffer, 0, Number(len));
    steps = _Read_Current_Response_String(array.byteOffset);

    resp = new TextDecoder('utf8').decode(array);
    resp_trim = resp.slice(0, resp.length - 2);
    try {
        resp_data = JSON.parse("[" + resp_trim + "]");
    } catch (error) {
        console.log(error);
        console.log(resp);
        console.log(resp_trim);
        waiting = false
        return false;
    }

    document.getElementById("options-rolls").value = Number(document.getElementById("options-rolls").value) + 1;

    dep_flag = false

    resp_data.forEach((perk) => {
        if (perk.success) {
            perk["reason"] = "Success"
        } else {
            if(dep_flag){
                perk["reason"] = "Dependency Failed"
            }else if (points < perk["cost"]) {
                perk["reason"] = "Insufficient Steps"
                dep_flag = true
            } else {
                perk["reason"] = "Max Repeats"
            }
        }
    })

    logs.push(resp_data);

    Generate_Perk_Display()

    waiting = false
    // console.log("done rolling!")
    return false
}

function Download_Save_File(data) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
    date = new Date();
    pom.setAttribute('download', `MoC_Save ${moc_version["extension"]} ${moc_version["version"]}_${moc_version["subversion"]} ${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}.json`);
    pom.style.display = 'none';
    document.body.appendChild(pom);
    pom.click();
    document.body.removeChild(pom);
}

function Generate_Save_Object() {
    return {
        "moc_version": moc_version,
        "logs": logs,
        "seed": Number(document.getElementById("options-seed").value),
        "seed_steps": Number(steps),
        "rolls": Number(document.getElementById("options-rolls").value),
        "steps":  _Get_Current_Points(),
        "formatting": {
            "success": document.getElementById("options-format-success").value,
            "fail": document.getElementById("options-format-fail").value,
            "perks": document.getElementById("options-format-between-perks").value,
            "perk_check": document.getElementById("options-format-reverse-check-perks").checked,
            "rolls": document.getElementById("options-format-between-rolls").value,
            "rolls_check": document.getElementById("options-format-reverse-check-rolls").checked
        }
    }
}
moc_version = {
    "extension": "core",
    "version": 0,
    "subversion":1
}
function Validate_Save_Object(save){
    for (const prop of ["moc_version", "logs", "seed", "seed_steps", "rolls", "steps", "formatting"]) {
        if(save.hasOwnProperty(prop)){
            continue
        }
        alert("save is not valid");
        return true
    }
    for (const prop of ["success", "fail", "perks", "perk_check", "rolls", "rolls_check"]) {
        if(save["formatting"].hasOwnProperty(prop)){
            continue
        }
        alert("save is not valid");
        return true
    }
    if(save["moc_version"].hasOwnProperty("extension")){
        if(save["moc_version"]["extension"] != moc_version["extension"]){
            alert(`this save is for the ${save["moc_version"]["extension"]} version of the march!Saves are not cross-compatibile.`);
            return true
        }
    }else{
        alert("save is not valid");
        return true
    }
    if(save["moc_version"].hasOwnProperty("version")){
        if(save["moc_version"]["version"] > moc_version["version"]){
            alert(`this save is for a future version of the march! Saves are not backwards compatible!`);
            return true
        }
    }else{
        alert("save is not valid");
        return true
    }
    if((save["moc_version"]["version"] == moc_version["version"]) && (save["moc_version"].hasOwnProperty("subversion"))){
        if((save["moc_version"]["subversion"] > moc_version["subversion"])){
            alert(`this save is for a future version of the march! Saves are not backwards compatible!`);
            return true
        }
    }else{
        alert("save is not valid");
        return true
    }
    return false
}

function Parse_Save_String(save){
    save_state = JSON.parse(save);
    if(Validate_Save_Object(save_state)){
        return
    }
    _Reset_Recieve_Amounts()
    logs = save_state.logs
    document.getElementById("steps").innerHTML = "CURRENT STEPS: " + save_state.steps
    document.getElementById("options-seed").value = String(BigInt(save_state.seed));
    document.getElementById("options-rolls").value = save_state.rolls
    seed_steps = BigInt(save_state.seed_steps)
    document.getElementById("options-format-success").value = save_state.formatting.success
    document.getElementById("options-format-fail").value = save_state.formatting.fail
    document.getElementById("options-format-between-perks").value = save_state.formatting.perks
    document.getElementById("options-format-reverse-check-perks").checked = save_state.formatting.perk_check
    document.getElementById("options-format-between-rolls").value = save_state.formatting.rolls
    document.getElementById("options-format-reverse-check-rolls").checked = save_state.formatting.rolls_check
    Generate_Perk_Display()

    logs.forEach((roll) => { roll.forEach((perk) => { if (perk.success) {
        _Increment_Prize_By_Id(perk.id);
    } }) })

    _Set_Rand_Seed(BigInt(save_state.seed), seed_steps, save_state.steps);
}

function Load_Save_File() {
    var file = document.getElementById('options-upload-file');
    if(file.files.length > 1){
        alert("You can only submit one file.");
    }
    if (file.files.length > 0) {
        var reader = new FileReader();

        reader.onload = function (e) {
            Parse_Save_String(e.target.result);
        };

        reader.readAsText(file.files[0]);
    }
}



function Load_Seed() {
    _Reset_Recieve_Amounts()
    new_seed = Number(document.getElementById("options-seed").value);
    // console.log(new_seed)
    logs = []
    document.getElementById("latest-roll").value = ""
    document.getElementById("roll-logs").value = ""
    num_rolls = Number(document.getElementById("options-rolls").value);
    // console.log(num_rolls);
    document.getElementById("options-rolls").value = 0
    _Set_Rand_Seed(BigInt(document.getElementById("options-seed").value), BigInt(0), 0);
    for (let index = 0; index < num_rolls; index++) {
        // console.log("roll")
        Get_Wasm_Reponse_String()
    }
}

function Init_Page(){
    _Reset_Recieve_Amounts()
    save_string = localStorage.getItem("save");
    if(save_string == null){
        logs=[]
        new_seed = Math.floor(Math.random() * 9223372036854775807)
        steps = BigInt(0)
        document.getElementById("options-seed").value = String(BigInt(new_seed));
        document.getElementById("options-rolls").value = 0;
        _Set_Rand_Seed(BigInt(new_seed), BigInt(0), 0);
        document.getElementById("latest-roll").value = ""
        document.getElementById("roll-logs").value = ""
    }else{
        Parse_Save_String(save_string)
    }
}

function Setup_Env() {
    document.getElementById("new-roll").addEventListener("click", () => {Get_Wasm_Reponse_String()});
    document.getElementById("options-format-reverse-check-perks").addEventListener("click", Generate_Perk_Display);
    document.getElementById("options-format-reverse-check-rolls").addEventListener("click", Generate_Perk_Display);
    document.getElementById("options-format-success").addEventListener("keyup", Generate_Perk_Display);
    document.getElementById("options-format-fail").addEventListener("keyup", Generate_Perk_Display);
    document.getElementById("options-format-between-perks").addEventListener("keyup", Generate_Perk_Display);
    document.getElementById("options-download-button").addEventListener("click", () => {Download_Save_File(Generate_Save_Object())})
    document.getElementById("options-upload-button").addEventListener("click", () => {Load_Save_File()})
    document.getElementById("options-generate").addEventListener("click", () => {Load_Seed()})
    document.getElementById("options-reset-button").addEventListener("click", () => {
        localStorage.removeItem("save");
        Init_Page();
    })
    document.getElementById("loading").style.display="none"

    Init_Page();
}

function Await_Wasm(){
    if(typeof(wasmExports) == 'undefined'){
        Module['onRuntimeInitialized'] = Setup_Env
        return
    }
    Setup_Env()
}

if (window.addEventListener) {
    window.addEventListener('load', Await_Wasm)
} else {
    window.attachEvent('onload', Await_Wasm)
}


async function Call_N_Times(n) {
    if ((n % 100) == 0) {
        console.log("calling ", n, " more times")
    }
    if (await Get_Wasm_Reponse_String()) {
        setTimeout(Call_N_Times, 50, n);
    } else if (n > 0) {
        setTimeout(Call_N_Times, 50, n - 1);
    }
}

// CRUD => CREATE READ UPDATE DELETE