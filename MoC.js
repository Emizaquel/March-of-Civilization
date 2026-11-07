moc_version = {
    "version": 0,
    "subversion":10
}

steps = 0n

class perk_group {
    constructor(name) {
        this.name = name
        this.enabled = true
        this.valid = true
    }
}

groups = [
    new perk_group("General"),
    new perk_group("Physics"),
    new perk_group("Stuff"),
    new perk_group("Spiritual"),
    new perk_group("Psychic"),
    new perk_group("Martial"),
    new perk_group("Alchemy"),
    new perk_group("Magic"),
    new perk_group("Eldritch"),
    new perk_group("Planar"),
    new perk_group("Powers")
]

perks = []

class perk {
    constructor(name, description, cost, max_repeats, dependencies, group) {
        this.id = perks.length
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.times_recieved = 0n;
        this.max_repeats = max_repeats;
        this.dependencies = dependencies;
        this.group = group;
        perks.push(this)
    }

    group_name(){
        return groups[this.group].name
    }

    check_viable(){
        if(groups[this.group].enabled){
            for (let index = 0; index < this.dependencies.length; index++) {
                if(perks[this.dependencies[index]].check_viable()){
                    continue
                }
                return false
            }
            if(this.max_repeats == 0n){
                return true;
            }
            return (this.times_recieved < this.max_repeats)
        }
        return false
    }

    // STATUS LEGEND
    // 0: success
    // 1: Max Repeats
    // 2: Unknown
    // 3: Unfilled Dependency
    // 4: Insufficient Points
    // 5: somehow group disabled? Shouldn't be possible anyways
    status(dependency_status){
        for (let i = 0; i < dependency_status.length; i++) {
            if(dependency_status[i] > 1){
                return 3
            }
        }
        if(this.cost > steps){
            return 4
        }
        if(!groups[this.group].enabled){
            return 5
        }
        if(this.max_repeats < 1){
            return 0
        }
        if(this.times_recieved < this.max_repeats){
            return 0
        }
        return 1
    }

    log(status){
        if(status < 1){
            steps = steps - this.cost
            this.times_recieved++
        }
        return {
            id:this.id,
            name:String(this.name),
            cost: String(this.cost),
            description: String(this.description),
            times_recieved: String(this.times_recieved),
            status: status,
            group: this.group_name()
        }
    }

    roll(){
        var response = []
        var dep_stat = []
        var deps = [...this.dependencies]
        var reqs = []
        for (let i = 0; i < deps.length; i++) {
            if(perks[deps[i]].times_recieved < 1n){
                var dependency = perks[deps[i]].roll()
                dependency.forEach((e)=>{
                    dep_stat.push(e.status)
                })
                response = response.concat(dependency)
                reqs.push(i)
            }
        }
        reqs.reverse()
        for (let i = 0; i < reqs.length; i++){
            deps.splice(reqs[i], 1)
        }

        var log = this.log(this.status(dep_stat))

        for (let i = 0; i < deps.length; i++) {
            var dependency = perks[deps[i]].roll()
            dependency.forEach((e)=>{
                dep_stat.push(e.status)
            })
            response = response.concat(dependency)
        }
        response.push(log)
        validate_groups()
        return response
    }
}

function get_perk_for_name(name){
    var valid_perks = perks.filter((e)=>{return e.name == name})
    if(valid_perks.length > 0){
        return valid_perks[0]
    }
    return null
}

function reset_all_perks_received(){
    console.log("reset");
    steps = 0n
    perks.forEach((e)=>{e.times_recieved = 0n})
}

function validate_groups(){
    groups.forEach((e)=>{
        e.valid = false
    })
    for (let i = 0; i < perks.length; i++) {
        const e = perks[i];
        if(groups[e.group].valid){
            continue;
        }
        if(!groups[e.group].enabled){
            continue;
        }
        groups[e.group].valid = e.check_viable()
    }
}

add_perks()

roll_log = []

class SeededRandomGenerator {
    constructor(seed) {
        this.seed = seed
        this.init = seed
        this.steps = 0n
    }

    setup(seed, steps = 0n){
        this.seed = seed
        this.init = seed
        this.steps = 0n
        for (let i = 0n; i < steps; i++) {
            this.step()
        }
    }

    step(){
        this.seed = ((((((this.seed & 4294967295n)*6364136223846793005n) + this.steps) & 18446744073709551615n) + ((((this.seed & 18446744069414584320n) >> 32n) + this.steps) & 18446744073709551615n)) * 4794421084237681671n) 
        this.seed = this.seed & 18446744073709551615n
        this.steps++
        return this.seed
    }

    export(){
        return {
            "seed": String(this.init),
            "steps": String(this.steps)
        }
    }

    rand_range(max){
        return Number(this.step() % BigInt(max))
    }
}

function generate_random_64(){
    outarr = new BigUint64Array(1);
    crypto.getRandomValues(outarr)
    return outarr[0]
}

seeded_generator = new SeededRandomGenerator(generate_random_64())

screens = []

function show_screen(){
    var new_screen = this.getAttribute("target");
    screens.forEach(async (screen)=>{
        if(screen.id == new_screen){
            screen.style.display = '';
            return
        }
        screen.style.display = 'None';
    })
}

function roll_pool(){
    var valid_perks = perks.filter((e)=>{
        return e.check_viable()
    })
    console.log(valid_perks)
    var per = valid_perks[seeded_generator.rand_range(valid_perks.length)];
    console.log(per)
    return per.roll()
}

function roll_category(){
    validate_groups()
    var valid_groups = groups.map((e, index)=>{if(e.valid){ 
            return index
        }
        return -1
    }).filter((e)=>{
        return e > -1
    })

    console.log(valid_groups);

    var chosen_group = valid_groups[seeded_generator.rand_range(valid_groups.length)];
    console.log(chosen_group);

    var valid_perks = perks.filter((e)=>{
        return e.check_viable()
    }).filter((e)=>{return e.group == chosen_group})

    return valid_perks;
}


function roll_perk(){
    steps = steps + BigInt(document.getElementById("options-increment").value)
    var this_perk
    if(document.getElementById("group_roll_checkmark").checked){
        this_perk = roll_category()
    }else{
        this_perk = roll_pool()
    }
    roll_log.push(this_perk)
}

function show_perk(){
    var target_perk = perks[this.value]
    var template = document.getElementById("catalogue-perk-detail-template").innerHTML
    var dependency_str = target_perk.dependencies.map((dependency)=>{return perks[dependency].name})
    dependency_str = dependency_str.join(", ")
    if(dependency_str == ""){
        dependency_str = "None"
    }
    template = template.replaceAll("{{name}}", target_perk.name).replaceAll("{{cost}}", target_perk.cost).replaceAll("{{group}}", groups[target_perk.group].name).replaceAll("{{repeats}}", target_perk.max_repeats).replaceAll("{{desc}}", target_perk.description).replaceAll("{{dependencies}}", dependency_str)
    document.getElementById("catalogue-perk-details").innerHTML = template
}

function list_perks(){
    var perk_listing = perks.map((perk)=>{return perk.name})
    var catalogue = document.getElementById("catalogue-listings");
    catalogue.innerHTML = ""
    perk_listing.forEach((perk, i)=>{
        template = document.getElementById("catalogue-listing-template").innerHTML
        template = template.replaceAll("{{id}}", i).replaceAll("{{name}}", perk)
        catalogue.insertAdjacentHTML("beforeend", template)
    })
    var perk_listings = catalogue.querySelectorAll('.catalogue-listing');
    perk_listings.forEach(async (listing)=>{
        listing.addEventListener("click",show_perk)
    })
}

function sync_enabled(){
    checkboxes = document.querySelectorAll(".enabled_group_checkmark")
    checked = 0
    checkboxes.forEach((box)=>{
        if(box.checked){
            checked = checked + 1
        }
    })
    if(checked < 1){
        this.checked = true
    }
    groups[this.value].enabled = this.checked
    validate_groups()
    return
}

function list_group_selector(){
    var group_frame = document.getElementById("group-selector-frame")
    group_frame.innerHTML = ""
    groups.forEach((e, i)=>{
        template = document.getElementById("group-selector-template").innerHTML
        template = template.replaceAll("{{index}}",i).replaceAll("{{group}}",e.name)
        group_frame.insertAdjacentHTML("beforeend", template)
        checkbox = group_frame.lastElementChild.firstElementChild;
        checkbox.checked = e.enabled
        checkbox.addEventListener("change", sync_enabled)
    })
}

perk_listings = document.querySelectorAll('.catalogue-listing')

function perk_search(){
    if(this.value == ''){
        perk_listings.forEach(async (listing)=>{
            listing.style.display = ''
        })
        return
    }
    var this_lower = this.value.toLowerCase()
    perk_listings.forEach(async (listing)=>{
        if(listing.innerHTML.toLowerCase().includes(this_lower)){
            listing.style.display = ''
            return
        }
        listing.style.display = 'none'
    })
}

function generate_perk_string(perk){
    template_string = document.getElementById("success-perk-format").value;
    if(perk.status){
        template_string = document.getElementById("fail-perk-format").value;
    }
    status_string = "success"
    switch (perk["status"]) {
        case 0:
            status_string = "Success"
            break;
        case 2:
            status_string = "Maximum Repeats"
            break;
        case 3:
            status_string = "Dependency Failed"
            break;
        case 4:
            status_string = "Insufficient Steps"
            break;
    
        default:
            status_string = "Something Went Wrong"
            break;
    }
    template_string = template_string.replaceAll("{{name}}", perk["name"])
    template_string = template_string.replaceAll("{{description}}", perk["description"])
    template_string = template_string.replaceAll("{{cost}}", perk["cost"])
    template_string = template_string.replaceAll("{{group}}", perk["group"])
    template_string = template_string.replaceAll("{{times}}", perk["times_recieved"])
    template_string = template_string.replaceAll("{{reason}}", status_string)
    return template_string
}

function generate_roll_string(roll, roll_number, reverse_perks){
    perk_strings = roll.map(generate_perk_string)
    if(reverse_perks){
        perk_strings.reverse()
    }
    content_string = perk_strings.join(document.getElementById("between-perk-format").value)
    template_string = document.getElementById("roll-format").value;
    template_string = template_string.replaceAll("{{content}}", content_string)
    template_string = template_string.replaceAll("{{number}}", roll_number)
    return template_string
}

function generate_save_object(){
    return {
        "moc_version": moc_version,
        "logs": roll_log,
        "steps": String(steps),
        "generator": seeded_generator.export(),
        "rolls": Number(document.getElementById("options-rolls").value),
        "groups":groups,
        "formatting": {
            "success": document.getElementById("success-perk-format").value,
            "fail": document.getElementById("fail-perk-format").value,
            "perks": document.getElementById("between-perk-format").value,
            "perk_check": document.getElementById("perk-reverse-checkmark").checked,
            "roll": document.getElementById("roll-format").value,
            "rolls": document.getElementById("between-roll-format").value,
            "rolls_check": document.getElementById("roll-reverse-checkmark").checked
        }
    }
}

function download_save_file() {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(generate_save_object())));
    date = new Date();
    pom.setAttribute('download', `MoC_Save ${moc_version["version"]}_${moc_version["subversion"]} ${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}.json`);
    pom.style.display = 'none';
    document.body.appendChild(pom);
    pom.click();
    document.body.removeChild(pom);
}

function update_perk_display(){
    var reverse_perks = document.getElementById("perk-reverse-checkmark").checked;
    var roll_strings = roll_log.map((e,i)=>{return generate_roll_string(e, i+1, reverse_perks)})
    var latest = roll_strings[roll_strings.length -1];
    if(typeof latest === 'undefined'){
        document.getElementById("latest-roll").value = ""
    }else{
        document.getElementById("latest-roll").value = latest
    }
    
    if(document.getElementById("roll-reverse-checkmark").checked){
        roll_strings.reverse()
    }
    document.getElementById("roll-history").value = roll_strings.join(document.getElementById("between-roll-format").value)
    document.getElementById("steps-display").innerHTML = steps
    document.getElementById("options-rolls").value = roll_log.length;

    localStorage.setItem("save", JSON.stringify(generate_save_object()));
}

function reset_march(){
    reset_all_perks_received()
    new_seed = generate_random_64()
    document.getElementById("options-seed").value = new_seed
    roll_log = []
    document.getElementById("options-rolls").value = 0
    seeded_generator.setup(new_seed)
    update_perk_display()
}

function override_march(){
    roll_log = []
    reset_all_perks_received()
    seeded_generator.setup(BigInt(document.getElementById("options-seed").value))
    var nroll = document.getElementById("options-rolls").value
    for (let index = 0; index < nroll; index++) {
        roll_perk()
    }
    update_perk_display()
}

function roll_button(){
    roll_perk()
    update_perk_display()
}

function pre_release_migration(candidate){
    var version_data = candidate["moc_version"]
    if(version_data["subversion"] < 6){
        version_data["subversion"] = 6
        candidate["generator"] = {
            "seed": String(candidate["seed"]),
            "steps": candidate["seed_steps"]
        }
        delete candidate["seed"]
        delete candidate["seed"]
        
        delete candidate["moc_version"]["extension"]
        candidate["groups"] = [{"name":"General","enabled":true,"valid":true},{"name":"Physics","enabled":true,"valid":true},{"name":"Stuff","enabled":true,"valid":true},{"name":"Spiritual","enabled":true,"valid":true},{"name":"Psychic","enabled":true,"valid":true},{"name":"Martial","enabled":true,"valid":true},{"name":"Alchemy","enabled":true,"valid":true},{"name":"Magic","enabled":true,"valid":true},{"name":"Eldritch","enabled":true,"valid":true},{"name":"Planar","enabled":true,"valid":true},{"name":"Powers","enabled":true,"valid":true}]
        candidate["logs"] = candidate["logs"].map((roll)=>{return roll.map((perk)=>{
            perk_out = 0
            switch (perk["reason"]) {
                case "Success":
                    perk_out = 0
                    break;
                case "Max Repeats":
                    perk_out = 1
                    break;
                case "Dependency Failed":
                    perk_out = 3
                    break;
                case "Insufficient Steps":
                    perk_out = 4
                    break;
                default:
                    perk_out = 2
                    break;
            }
            var renames = ["Geass"]
            var names = ["Geas"]
            var new_name = perk["name"]
            var renamed = renames.indexOf(new_name)
            if(renamed > -1){
                new_name = names[renamed]
            }
            new_perk = {
                "id" : perk["id"],
                "name" : new_name,
                "cost" : perk["cost"],
                "group": groups[get_perk_for_name(new_name).group].name,
                "description" : perk["description"],
                "times_recieved" : perk["times_recieved"],
                "status" : perk_out,
            }
            return new_perk
        })})
        candidate["formatting"]["success"] = candidate["formatting"]["success"].replaceAll("{{times_recieved}}", "{{times}}")
        candidate["formatting"]["fail"] = candidate["formatting"]["fail"].replaceAll("{{times_recieved}}", "{{times}}")
        candidate["formatting"]["roll"] = "{{content}}"
        // candidate["formatting"]["rolls"] = "\n------- between perks -------\n"
    }
    return candidate
}

function attempt_migration(candidate){
    version_data = candidate["moc_version"]
    if(version_data["version"] < 1){
        candidate = pre_release_migration(candidate)
    }
    return candidate
}

function validate_save(save_string){
    try {
        var candidate = JSON.parse(save_string);

        if(candidate["moc_version"]["version"] > moc_version["version"]){
            return false
        }
        if(candidate["moc_version"]["subversion"] > moc_version["subversion"]){
            return false
        }

        candidate = attempt_migration(candidate)
        var properties = Object.getOwnPropertyNames(candidate)
        if(["moc_version","logs","rolls","steps","formatting","generator","groups"].map((e)=>{return properties.includes(e)}).includes(false)){
            return false
        }

        var properties = Object.getOwnPropertyNames(candidate["generator"])
        if(["seed","steps"].map((e)=>{
            if(properties.includes(e)){
                return (typeof candidate["generator"][e] === "string")
            }
            return false
        }).includes(false)){
            return false
        }

        properties = Object.getOwnPropertyNames(candidate["formatting"])
        if(["success","fail","perks","rolls","roll"].map((e)=>{
            if(properties.includes(e)){
                return (typeof candidate["formatting"][e] === "string")
            }
            return false
        }).includes(false)){
            return false
        }

        properties = Object.getOwnPropertyNames(candidate["formatting"])
        if(["perk_check","rolls_check"].map((e)=>{
            if(properties.includes(e)){
                return (typeof candidate["formatting"][e] === "boolean")
            }
            return false
        }).includes(false)){
            return false
        }
        
        var valid_groups = ["General","Physics","Stuff","Spiritual","Psychic","Martial","Alchemy","Magic","Eldritch","Planar","Powers"]
        if(candidate["groups"].map((e)=>{
            if(!valid_groups.includes(e.name)){
                return false
            }
            if(typeof e.enabled !== "boolean"){
                return false
            }
            if(typeof e.valid !== "boolean"){
                return false
            }
            return true
        }).includes(false)){
            return false
        }
        
        return candidate
    } catch (e) {
        console.log(e)
        return false;
    }
}

function flash_red(targetelem){
    targetelem.style.backgroundColor = "#820000"
    setTimeout(() => {
        targetelem.style.backgroundColor = ""
    }, 100);
    
    save_candidate = null
}

const default_file_label = "Click or drag a file here to upload it"

function false_file_label(label_elem){
    flash_red(label_elem)
    document.getElementById("options-upload-name").innerHTML = default_file_label
    document.getElementById("options-upload-button").disabled = "true"
}

function handle_save_upload(){
    parent = this.parentElement
    files = this.files

    if(files.length > 1){
        alert("You can only submit one file.");
        this.value = null
        false_file_label(parent)
        return
    }

    
    if (files.length > 0) {
        var reader = new FileReader();
        if(files[0].type != "application/json"){
            this.value = null
            false_file_label(parent)
            return
        }

        firstfile = files[0]

        reader.onload = function (e) {
            save_candidate = validate_save(e.target.result)
            if(save_candidate){
                document.getElementById("options-upload-name").innerHTML = firstfile.name
                document.getElementById("options-upload-button").disabled = false
            }else{
                this.value = null
                false_file_label(parent)
                return
            }
        };

        reader.readAsText(firstfile);
    }
    
    
}

async function load_save(save_object){
    reset_all_perks_received()
    console.log(save_object)
    seeded_generator.setup(BigInt(save_object.generator.seed), BigInt(save_object.generator.steps))
    document.getElementById("options-seed").value = save_object.generator.seed
    document.getElementById("options-rolls").value = save_object.rolls
    roll_log = save_object["logs"]
    candidate_format = save_object["formatting"]
    document.getElementById("roll-reverse-checkmark").checked = candidate_format.rolls_check;
    document.getElementById("perk-reverse-checkmark").checked = candidate_format.rolls_check;
    document.getElementById("perk-reverse-checkmark").value = candidate_format.perk_check;
    document.getElementById("success-perk-format").value = candidate_format.success;
    document.getElementById("fail-perk-format").value = candidate_format.fail;
    document.getElementById("between-perk-format").value = candidate_format.perks;
    document.getElementById("roll-format").value = candidate_format.roll;
    document.getElementById("between-roll-format").value = candidate_format.rolls;
    for (let index = 0; index < roll_log.length; index++) {
        const roll = roll_log[index];
        for (let innerdex = 0; innerdex < roll.length; innerdex++) {
            const perk = roll[innerdex];
            if(perk.id < 0){
                continue
            }
            if(perk.status < 1){
                perks[perk.id].times_recieved++
            }
        }
    }
    steps = BigInt(save_object["steps"])
    console.log("end")
    update_perk_display()
    document.getElementById("options-upload-name").innerHTML = default_file_label
    document.getElementById("options-upload-button").disabled = "true"
}

function accept_save(){
    if(!save_candidate){
        return
    }
    load_save(save_candidate)
    save_candidate = null
}

function setup_march(){
    // if(typeof wasmExports === 'undefined'){
    //     return setTimeout(setup_march, 10)
    // }
    list_group_selector()
    list_perks()

    screens = document.querySelectorAll('.option-screen')
    perk_listings = document.querySelectorAll('.catalogue-listing')


    document.querySelectorAll('.nav-link').forEach((button)=>{
        button.addEventListener('click', show_screen)
    })
    document.getElementById("catalogue-search").addEventListener("keyup",perk_search)
    document.getElementById("options-upload-file").addEventListener("change", handle_save_upload)
    document.getElementById("roll-button").addEventListener("click", roll_button)
    document.getElementById("options-reset-button").addEventListener("click", reset_march)
    document.getElementById("options-override-button").addEventListener("click", override_march)
    document.getElementById("options-upload-button").addEventListener("click", accept_save)

    document.querySelectorAll('.options-textarea').forEach((tarea)=>{
        tarea.addEventListener("keyup", update_perk_display)
    })
    document.getElementById("perk-reverse-checkmark").addEventListener("click", update_perk_display)
    document.getElementById("roll-reverse-checkmark").addEventListener("click", update_perk_display)
    document.getElementById("main-download-button").addEventListener("click",download_save_file)
    document.getElementById("options-download-button").addEventListener("click",download_save_file)
    var save_string = localStorage.getItem("save");
    if(save_string == null){
        reset_march()
    }else{
        var cache_save = validate_save(save_string)
        if(cache_save){
            load_save(cache_save)
        }else{
            localStorage.removeItem("save")
            reset_march()
        }
    }

    save_drop = document.getElementById("options-upload-file").parentElement
    save_drop.addEventListener("drop", (e)=>{
        e.preventDefault()
        console.log(e)
        if(e.dataTransfer.files.length > 1){
            return
        }
        if(e.dataTransfer.files[0].type === "application/json"){
            document.getElementById("options-upload-file").files = e.dataTransfer.files
            document.getElementById("options-upload-file").dispatchEvent(new Event('change'));
        }
        console.log(document.getElementById("options-upload-file").files )
    })
    save_drop.addEventListener("dragover", (e) => {
        const fileItems = [...e.dataTransfer.items].filter(
            (item) => item.kind === "file",
        );
        if (fileItems.length > 0) {
            e.preventDefault();
        }
    });
    window.addEventListener("dragover", (e) => {
        const fileItems = [...e.dataTransfer.items].filter(
            (item) => item.kind === "file",
        );
        if (fileItems.length > 0) {
            e.preventDefault();
        }
    });

    window.addEventListener("drop", (e) => {
        const fileItems = [...e.dataTransfer.items].filter(
            (item) => item.kind === "file",
        );
        if (fileItems.length > 0) {
            e.preventDefault();
        }
    });
    validate_groups()
}

window.addEventListener("load", setup_march)
