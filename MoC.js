moc_version = {
    "version": 0,
    "subversion":6
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
            return true
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
        for (let i = 0; i < this.dependencies.length; i++) {
            var dependency = perks[this.dependencies[i]].roll()
            dependency.forEach((e)=>{
                dep_stat.push(e.status)
            })
            response = response.concat(dependency)
        }
        var log = this.log(this.status(dep_stat))
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

function add_perks(){
    new perk("Spiritual Energy", "The stuff that makes up souls. that undefinable thing that still defines everything. Everything makes it all the time, though you perhaps make more than usual. You are now able to manipulate it to your own ends", 0n, 0n, [], 3)
    new perk("The Root of Meaning", "There is meaning to this world. Yet, if you ground all of existence into it's finest components and searched through it all, you would find none. It is this paradox that you now command, to be able to empower the very meaning that is born of form", 300n, 1n, [0], 3)
    new perk("Divine Insight", "Gods Exist. Or do they? Born of belief yet having always existed, it is difficult to say if people created gods or gods created people. The answer to that dichotomy is the core to divinity - the end result of Meaning enforced upon existence through collective action. And that is a secret you now hold in your heart of hearts", 300n, 1n, [0], 3)
    new perk("Sword Intent", "Or anything intent, really, you know how to imbue spiritual energy into items you craft giving them the beginnings of sentience. Though they will never develop any true sapience, they are born with 'instincts' regarding their proper use and will learn alongside their wielders. They can make their desires known to their operators and function better than they physically should, growing as their souls do.", 300n, 1n, [0], 3)
    new perk("Spirits", "Not quite souls, but perhaps something along the way. Spiritual constructs with a degree of agency capable of carrying out specific tasks and acting in a specific manner are far simpler to make and can ", 600n, 1n, [0], 3)
    new perk("Souls", "Souls are a complex thing. Yet, ultimately, quite simple to make. Even the complex souls of people are often created though complete accident. Indeed, a simple object well cared for will eventually gain an identity strong enough to form a soul. You now understand this principle that with sufficient study you can create souls of varying complexity from simple rocks to the intricate existences of people and possibly beyond.", 900n, 1n, [0], 3)
    new perk("Elementals", "Elementals are interesting things. In many ways, they are concepts, enforced onto the world souls that have no need for a form to interact with the world. Though, perhaps because of this, they tend to be... otherwise simple. Still, you understand how to reinforce spiritual structures so that they may influence the wider world without a supporting anchor.", 600n, 1n, [0], 3)
    new perk("Ichor", "Said to be the blood of gods, this material is effectively condensed spiritual energy, rendered into a mores table form. This has a number of uses, though that might require some experimentation for you to uncover", 300n, 1n, [0], 3)
    new perk("Altar", "These devices gather devotion, the deliberate act of sacrifice in order to venerate another, be that of time or something more material. When these acts are performed at an alter, it empowers the souls of the item in question.", 300n, 1n, [2], 2)
    new perk("Icon", "These devices gather faith, the deep seated belief in the capabilities of something. This empowers that soul to act within the vicinity of the icon, dependent on the belief of the wielder.", 300n, 1n, [2], 2)
    new perk("Offering", "By preparing an object and ritually destroying it, you can grant strength to the items that you wish to empower. You know how to imbue things with additional spiritual strength, as well as identifying specific offerings in line with the soul in question.", 200n, 1n, [2], 3)
    new perk("Pact", "A sufficiently powerful soul may grant a portion of it's power to another, bestowing them with a measure of their strength. In doing so however, the recipient is bound to the terms of the transfer. You know how to create such pacts, both as the recipient and the bestower", 600n, 1n, [0], 3)
    new perk("Demesne", "An space claimed by a sufficiently powerful soul can, with time, be suffused with their strength, empowering allies and weakening foes. The strength of this depends of the age of the claim and the power of the soul in question. You understand how this process works, and even how to replicate it should you have the strength", 300n, 1n, [0], 3)
    new perk("Cairn", "Souls normally travel through the natural paths to afterlives and through reincarnation upon the deaths of their mortal forms. However, you know how to create a new path, creating a shelter for souls that meet various criteria", 750n, 1n, [0], 3)
    new perk("Meridians", "These channels of Spiritual Energy enable a soul to more easily effect the physical world. These run through the physical counterpart of the soul, not only allowing the soul to manifest exotic effects, but also granting a measure of the strength and durability of the soul onto the body", 400n, 1n, [0], 3)
    new perk("Aura", "The properties of a soul made evident. Through various means, you may extend the spiritual presence of a soul such that other souls become aware of it. This may simply be limited to a 'vibe' for weaker souls, but more powerful ones will radiate their particular nature in a manner that is obvious to any witnesses", 300n, 1n, [0], 3)
    new perk("Realm", "A space claimed by a soul can begin to show the properties of the soul in question, should it be sufficiently powerful and have enough time to work. Though this may simply begin as a place's ownership being evident, the ream will take on traits that reflect the owner's soul", 500n, 1n, [0], 3)
    new perk("Totemic Spirit", "More a sprit of an idea than anything else, these constructs are effectively the souls of things like families, organizations or even causes. In addition to being able to eventually empower those aligned with it, the spirit can also act as a focus for empowerments to be spread across a broader concept", 600n, 1n, [0], 3)
    new perk("Koshchei's Box", "Physical distance means very little to a soul, at the end of the day, and sometimes it's best to keep a soul safe - elsewhere. You know how to create a container for a soul, allowing it to remain safe elsewhere while still retaining normal faction of it's physical body.", 400n, 1n, [1], 3)
    new perk("Divine Regalia", "You know how to create tools that amplify aspects of a divine existence, allowing them to be more easily expressed unto the physical universe. As a side effect, even your mundane creations are of such quality that the gods themselves would fight over them.", 300n, 1n, [2], 3)
    new perk("Ghost Traps", "You can create devices that can contain spiritual presences. These traps activate under specific conditions and drag any spiritual presences not bound within a physical anchor into a holding chamber from which they can later be released", 0n, 1n, [0], 2)
    new perk("Unhallowed Ground", "You can prepare a space such that it is inimitable to spiritual presences, and are capable of optimising the effect for specific groups or individual examples for greater effect given sufficient knowledge of them. At a base level, this offers resistance to their influence but can scale to utterly barring them from being able to access the space.", 500n, 1n, [0], 3)
    new perk("Psionics", "The true power of Mind over Matter. Though it is not limited to the realm of the material psionic energy is a manifestation of your inner self on the outside world. This grants basic psionic abilities, though nothing exceptional", 0n, 0n, [], 4)
    new perk("WE/YOU/I ARE ONE", "Your mind is a part of a greater whole thoughts and beliefs flow in and out. The boundary of your existence if far more permeable than you would have thought and you know how to have your mind reach out, feel and manipulate", 300n, 1n, [22], 4)
    new perk("Where Do I End", "You are a part of the universe. A part that thinks. But where do you end? You have a command over your existence that most of it does not have, and with the right Will, you may enforce that command over more than thoughts", 300n, 1n, [22], 4)
    new perk("Technokinesis", "What is technology, but the dreams of people made manifest. Technology has a particular relationship with psionic energies, and you now have the aptitude necessary to directly interface with technology of all kinds with your psychic prowess.", 500n, 1n, [22], 4)
    new perk("Thermokinesis", "Though some might think of this as pyrokinesis, in truth, this is a broader discipline. Temperature is a fundamental part of reality, and one that you can now exercise some serious control over.", 300n, 1n, [22], 4)
    new perk("Photokinesis", "Though it may seem as though telekinesis creates energy, that is largely a side effect of the resultant movement. Truly creating energy from psionic power is actually fairly tricky. Still, you now have the aptitude and basic skills necessary to generate bursts of light and even manipulate existing photons through psionic might.", 300n, 1n, [22], 4)
    new perk("Electrokinesis", "Manipulating something as small and uncertain as electrons requires a delicate touch and a certain mentality that you now possess. Not only are you able to make electrons dance, but you can also generate magnetic fields through will alone.", 300n, 1n, [22], 4)
    new perk("Psionic Integration", "Psychoactive materials are quite difficult to make, but an integral part of any psionic technology that doesn't involve an ability for self-determination. You gain the fundamental knowledge necessary needed to build psionic devices, including the relevant structural and chemical theory", 300n, 1n, [22], 4)
    new perk("Telepathic Interface", "Controlling devices with your mind is an interesting prospect, though one that generally requires another mind to link with. With careful application however, you can create a system that operates almost as an extension of the user, receiving and sending telepathic signals that can allow for the use of complex systems", 300n, 1n, [29], 4)
    new perk("Telekinetic Arrays", "Ah, motive force. The fundamental interface between the now and will be. Producing this through artificial means is the core of creating psionic technology with an ability to impact the physical world.", 300n, 1n, [29], 4)
    new perk("Illusionary Systems", "Illusions are an interesting aspect of the psionic arts. Though some believe it could be considered an aspect of telepathy, the truth is that illusions are far more complex constructs, capable of programmed action independent of direct control. These psionic constructs can effectively be used as incredibly versatile components that can be altered as necessary", 300n, 1n, [29], 4)
    new perk("Mimetic Technology", "Ideas are the genetics of civilisation, from opinions to traditions, being able to create mental constructs that spread and persist is both easy and incredibly difficult. Simple earworms are but party tricks compared to what you are capable of.", 500n, 1n, [22], 4)
    new perk("Empathic Sensors", "Reaching into the subconscious is quite tricky, but necessary for a wide variety of purposes. Through various complex psionic processes, you can create sensors that pick up emotion, desires, intent and all the other underlying currents of the mind", 300n, 1n, [29], 4)
    new perk("Mind Crystals", "While there are mundane materials that can interact with psionic energies, few things can compare to materialised psionic energy. Both in terms of it's ability to interact with external psionic energy and fuel psionic creations through the controlled release of the stabilised power.", 200n, 1n, [22], 4)
    new perk("Thoughtforms", "Complex psionic constructs are interesting, in that they produce a sort of intelligence independent of any actual mind. Though this is often limited to a programmatic response to psionic stimuli, these creations are quite interesting", 200n, 1n, [22], 4)
    new perk("Mindscapes", "A mindscape is interesting, even the mundane exercises can yield useful results. However, a psionic adept can use this to extremely interesting effect allowing for better control over memory and various aspects of the mind", 200n, 1n, [22], 4)
    new perk("Mental Defences", "The existence of psionics is somewhat unsettling to some, and even psychics are only able to fight off attacks that they are aware of. As such, there comes a need to be able to create autonomous constructs that can protect the mind from unwanted intrusion", 200n, 1n, [22], 4)
    new perk("True Speech", "Communication in and of itself is an interesting phenomenon, a mind influencing others through the sharing of information. This has implications to a psionic individual, and with the right skills it becomes possible to understand and make yourself understood by dealing with the informational content of any message", 300n, 1n, [22], 4)
    new perk("A Memory", "What it seems like. A memory, one extracted from your mind or one being focused on by another. It takes the form of liquid lightning and can be passed on to others.", 200n, 1n, [22], 4)
    new perk("Mental Helm", "This physical object, when placed in proximity to the seat of consciousness imbues it's wearer with powerful psionic protections, allowing them to shrug off almost any mental intrusion. ", 200n, 1n, [29], 4)
    new perk("Ki", "A mystical energy associated with feats of physical and athletic prowess. This energy grows in response to physical exertion and tends produce results for physical training beyond what would be considered natural. This grants you capabilities equal to an average adept, nothing particularly special, but nothing to be concerned about either", 0n, 0n, [], 5)
    new perk("Put Your Back Into It", "Ki is substance, it is existence. You know how to call upon this energy and put your whole self into everything you do. In addition to magnifying the effects of your actions, it allows you a control over the outcome of your actions beyond what is physically possible.", 300n, 1n, [42], 5)
    new perk("Martial Reinforcement", "You know how to flow your Ki into objects you wield making them more durable and effective. You skill in this grows with time and power, but even initially, you can empower swords enough to cut through wooden posts without so much as dulling the blade.", 300n, 1n, [42], 5)
    new perk("Legendary Smith", "You know how to infuse Ki into every part of the weapon creation process, Yourself, your tools and your materials, creating works that are orders of magnitude more powerful than they should be", 300n, 1n, [42], 5)
    new perk("Beat it into Them", "Demonstrating, but the real way to learn how to fight is to fight. You can train people incredibly quickly through a combination of demonstration and sparring forcing proper form and technique into the minds of your students", 300n, 1n, [42], 5)
    new perk("Attuned Tools", "It normally takes years for someone to truly come to know a weapon, allowing them to use it as an extension of themselves. You can look at someone an know how to adjust your creations in such a way that their new weilders will feel more like they have regained a lost limb as opposed to picking up a new weapon", 300n, 1n, [42], 5)
    new perk("Prized Bloodline", "Certain fighters have specific talents, born of pure chance or breeding programs that might have gone on for generations. Not only can you identify the martial talents put in front of you, you can also isolate and replicate these factors in others", 300n, 1n, [42], 5)
    new perk("Strict Diet", "You are what you eat. Not only do you know what food is best for what purposes, but based on the resources you have available to you, you also know how to create the optimal possible diet for any given outcome, significantly accelerating progress. This also works for abnormal nutrition requirements like specific kinds of blood for vampires or alternative fuel sources for androids", 300n, 1n, [42], 5)
    new perk("Technique Scrolls", "Getting the intricacies of martial technique to survive you is tricky. Martial arts is not often best described by words and pictures. But you can do it. In fact, you know exactly how to produce instructional materials of all kinds that are incredibly instructive items capable of perfectly pouring knowledge into even the poorest of pupils", 300n, 1n, [], 5)
    new perk("Strange Concoctions", "These substances work far better than they should. Taking advantage of the supernatural qualities of Ki, these substances are able to perform feats that could be considered miraculous. They can cure mortal wounds, grant immense stamina or incredible strength or speed", 400n, 1n, [42], 5)
    new perk("Extreme Training", "Ki makes things that might seem impractical entirely possible. Be it carrying around massive rocks, or dodging arrows blindfolded, you know how to get extreme results from extreme effort, the more extreme the better", 500n, 1n, [42], 5)
    new perk("Training Grounds", "You know how to organize a space in such a way that it is perfect for particular uses, to a supernatural degree. Through the careful application of Ki and the flows of energy, you can create spaces that accelerate training or indeed any other specific activity", 400n, 1n, [], 5)
    new perk("Animalistic Skill", "It is said that the old masters learned to fight by observing the movements of animals, producing various schools of martial arts. At their height these warriors were capable of nearly magical feats, replicating the inhuman capabilities of these creatures. With study and training, you can now also replicate some of the physical feats of these creatures.", 500n, 1n, [42], 5)
    new perk("Honor Vow", "You know how to... concentrate your existence. To focus your presence. You know how to use Ki to invest a significant part of yourself towards accomplishing a goal or understaking. This technique is not one to make lightly, while working towards your goal with augment you more and more as you approach it, breaking your vow will also become more and more hazardous as you do", 300n, 1n, [42], 5)
    new perk("Conservation of Ninjutsu", "Co-ordination, even between allies is an incredibly difficult skill, and it only grows more difficult as the number of enemies grows. At a certain point even telepathy and other such tricks are not enough to overcome those challenges. You know how to pick out these gaps and flaws and use them to give you the upper hand, redirecting attacks and saving your own strength and stamina to easily handle large groups", 750n, 1n, [], 5)
    new perk("Berserker State", "You know the mind and how to take advantage of the reserves of strength it can bring forth. With some thought you can devise tailored exercises that will allow you or those you train to enter altered emotional states that allows you to fight far beyond your usual limits of strength and endurance", 1000n, 1n, [42], 5)
    new perk("Vital Spirit", "There are limits to power, ends to your strength, but sometimes you need to push past it, regardless of the cost. There are limitations built into any mortal form. And there are ways to push past them. You know how to cast from reserves usually considered vital - though the healing process might not be worth the advantage it gives you in this fight", 500n, 1n, [], 5)
    new perk("Final Breath", "You understand the deepest realms of martial strength, that essential core of any fighter. You know what drawing upon this will do, even the most powerful forms of ressurection will struggle with calling you back from this. But sometimes what you are fighting for is worth more than you are", 500n, 1n, [42], 5)
    new perk("Accelerated Recovery", "You know how to call upon your Ki in such a way that it accelerates the process of healing while not only retaining but even improving the benefits of such exertion. Your body adapts to strain more quickly and without issue.", 400n, 1n, [42], 5)
    new perk("Mirror Moves", "An enemy can be the best teacher sometimes, and when it comes to you, that is most definitely true. You easily pick up moves, tricks and skills used against you, identifying them almost immediately and only needing another one or two examples to fully internalise it.", 200n, 1n, [], 5)
    new perk("Piercing Eye", "The limitations of the physical form cannot be overcome through skill alone, and there are always compromises to be made. Compromises that you can easily identify. From even a single example, you know what you need to do in order to counter any specific move of means of attack, though leveraging that information is a matter of your own skills.", 200n, 1n, [], 5)
    new perk("Perfect Flow", "Skill in battle is not just about what you know, but how you put it into practice. You have a particular talent for efficiency, able to efficiently execute your intended movements without a single wasted calorie of effort. This carries over into the rest of your life, granting you a certain undeniable presence.", 200n, 1n, [], 5)
    new perk("Alchemic Symbols", "There are patterns, esoteric symbols that form the basis of alchemy. They require not particular affinity, merely knowledge of their function and the right training in order to enact simple instantaneous effects. You can receive this perk up to five times, the first granting your access to the core four (disintegration, cleansing, assembly and stasis), the next granting you effigies of the states of  matter and energy (solid, liquid, gas, plasma etc and heat, mass, light etc). The third grants you access to the four base conceptual elements (fire, water, earth, air) and the fourth grants you the Unreal Words (spirit, thought, motion, divinity, stories, ideas etc). The last, however, grants you every remaining word allowing you to describe anything in alchemical terms.", 400n, 5n, [], 6)
    new perk("Transmutation Arrays", "These complex arrangements of alchemical symbols allow you to enact various alchemical processes in such a way that you can chain together a series of symbols representing various items in order to enact transmutations, alchemical processes that transform items. The first time you receive this perk your main focus is in altering the structure of items, retaining the same materials. The next allows you some control over their form, allowing you to transform items into other things so long as they are generally similar. The last stage grants you sufficient understanding to reduce objects their base materials and reconstruct them into entirely new forms.", 300n, 3n, [64], 6)
    new perk("Destruction", "This grants you a deep understanding of the fundamental concept of destruction, the ability to render something down to parts and components.", 300n, 1n, [], 6)
    new perk("Purification", "You gain an intuitive understanding of the process of purification, of how to remove impurities from any substance, returning it to a pure state.", 300n, 1n, [], 6)
    new perk("Construction", "You know how to combine various materials in order to create complex substances, allowing you to create new materials and mechanisms that allow you greater flexibility.", 300n, 1n, [], 6)
    new perk("Stability", "You know how to finish an alchemical process, rendering the result of your works as permanent as if the product was natural. A Stable alchemical creation is as real as any natural equivalent", 300n, 1n, [], 6)
    new perk("Elixir of Life", "You know how to create an alchemical substance that can de-age living things, extending their lifespan. This requires difficult to get ingredients and is a complex process even for the best alchemists.", 500n, 1n, [66,67,68,69], 2)
    new perk("Panacea", "You know how to create an alchemical substance that can heal any injury or cure any disease. It is very difficult to make, even for the greatest alchemists and requires rare ingredients.", 500n, 1n, [66,67,68,69], 2)
    new perk("Philosopher Stone", "You know how to suspend the alchemical process, producing a stable energy that can act as a universal source for any alchemical process. This can even substitute for some of the ingredients of complex alchemical works.", 750n, 1n, [66,67,68,69], 2)
    new perk("The Great Work", "You know how to alter the very fundamentals of reality, refining objects in such a way as they are more perfect in some way, approaching the conceptual ideal of what it means to be that object. This allows them to act more effectively when used for their intended purposes.", 1000n, 1n, [], 6)
    new perk("Atomic Synthesis", "You know how to bypass the usual material constraints of Alchemy, transforming the vary materials that compose physical items. By breaking things down to the subatomic level, you can reassemble the building blocks into new elements and substances.", 500n, 1n, [], 6)
    new perk("Automated Alchemy", "Alchemy is normally a manual process, involving the direct intervention of the alchemist in question. However, you know how to account for every stage of the transmutation, allowing them to be operate entirely independently.", 750n, 1n, [65], 6)
    new perk("Chimeric Creations", "Given the complex nature of living systems, working with them in alchemical procedures is always a challenge. However, it is possible to treat living components as something of a black box, combining them to other systems through alchemical processes. Though this can be a little... crude in appearance.", 400n, 1n, [64], 6)
    new perk("Living Alchemy", "Life is extremely difficult to effect through alchemical processes. As a complex and chaotic environment, working any alchemy on a living thing is incredibly difficult, but you now understand how to account for these things, allowing you to heal and otherwise manipulate a body.", 350n, 1n, [64], 6)
    new perk("Homunculi", "Creating animate objects is considered one of the greater alchemical feats. And it is one that you are now capable of. Though this does not grant the knowledge required to produce minds with true intelligence, you can encode any form of logic you can understand.", 500n, 1n, [64], 6)
    new perk("Bloodline Transmutation", "You know how to embed alchemical understanding into the very essence of beings. This enable the being to more easily enact alchemical processes that involve this knowledge. However, the difficulty increases with the scope of the knowledge inserted. Most beings have trouble holding more than a single secret.", 300n, 1n, [64], 6)
    new perk("Simplified Transmutation", "You know how to reduce the usually complicated process associated with alchemy into much simpler forms. Indeed, some processes can be reduced to such a level that they can be held entirely in the mind, allowing a person to enact transmutations without external aid.", 500n, 1n, [65], 6)
    new perk("Complex Creations", "You know how to encode extremely complex structural information into your alchemical processes, allowing you to produce complex items such as machines with many moving and independent parts.", 300n, 1n, [64], 6)
    new perk("Alchemic Reversion", "Though it may seem that alchemical  transmutations are perfect, you know how to pick at the seams of such things, allowing you to reverse various alchemical processes. Though, some are easier than others. The quality of the transmutation factors heavily into how perfectly something has been altered and thus the difficulty in reversing any such changes.", 1200n, 1n, [64], 6)
    new perk("Magic", "The ultimate expression of mysticism, this grants you a supply of that arcane energy that is permits so many forms of supernatural capabilities. Though you are no archmage, your capabilities are not weak either. This grants you the power of a middling mage, capable of learning most spells.", 0n, 0n, [], 7)
    new perk("Wishes and Dreams", "Magic, ultimately is about belief. It is about effect following cause, even when the physical realities don't align. From the greatest rituals to the least cantrip, it is this foundation that persists, and one that you understand on a fundamental level", 300n, 1n, [83], 7)
    new perk("Enchanting", "Magic is effect. It is the result of arcane intention enforced unto reality. So often that means that it is transient, ephemeral. But you know how to bind it. Though thematic substrates will make it easier, you are able to bind a mystical effect to any item and engage the result repeatedly though perhaps with a cooldown depending on the scale of the effect.", 600n, 1n, [83], 7)
    new perk("Arcane Focus", "Manipulating magic takes imagination, focus, knowledge and power. While some things are dependent on the wielder you can make it easier to focus, at least. From augmenting a mage's focus directly or simply offloading some of the strain, you know how to make tools that ease the process of performing arcane acts.", 200n, 1n, [83], 7)
    new perk("Potioncraft", "Ah, those flasks of mysterious fluid all sitting pretty on the shelf. You know the intricacies of how ingredients interact and the subtle power that lies within a cauldron. You know what ingredients can be substituted for each other and how call the sparks of magic from what seems like mundane materials.", 300n, 1n, [83], 7)
    new perk("Rituals", "Grand desires often entail grand action. This is true in magic just as it is in other ventures. Through sacrifice both material and symbolic you know how to vastly increase the scale at which your magic can function.", 600n, 1n, [83], 7)
    new perk("Geomancy", "Ley Lines, Genus Loci, Places of Power... all of these have immense arcane might that you can turn to your ends. You can manipulate and even create these artefacts.", 900n, 1n, [88], 7)
    new perk("Divination", "To be a wizard, witch or even sorcerer is to be someone with wisdom or knowledge beyond common ken. And magic has many ways of gathering that information. You have a talent for various forms of divination - that inner eye that you can hone with sufficient practice", 550n, 1n, [83], 7)
    new perk("Grimoire", "Simply storing arcane lore is difficult, knowledge is power and powerful magic is often not particularly predictable. You however, know how to encode magical secrets in a manner that is safe and understandable, allowing you to ease the process of working complex acts. These methods also happen to be great at handling all kinds of exotic knowledge.", 400n, 1n, [83], 2)
    new perk("Portals", "Being able to access distant locales has always been a dream of mages, and is particularly useful when it comes to transporting large amounts of material or people. You understand magic that allows you to create passages connecting any places you can adequately describe of any size or duration , though as those factors become greater, harder to describe or encounter various obstacles (even simple distance)", 300n, 1n, [85], 7)
    new perk("Teleportation", "You are here, and now you are not. You now have knowledge of a spell that allows you to teleport yourself, and sufficient understanding to alter it to affect others and even groups, though that increases the cost and complexity.", 200n, 1n, [84], 7)
    new perk("Fated Blow Enchantment", "You know how to enchant projectile weapons such that they will always hit their target. From named bullets to spears that would weave around obstacles, this enchantment can be tweaked and optimised for a variety of expressions.", 250n, 1n, [85], 7)
    new perk("Elemental Enchantment", "You are able to imbue items with elemental powers, granting them permanent extensions of their capabilities through their new elemental enhancements, such as blades that burn and hammers that send out bludgeoning shockwaves of wind.", 0n, 1n, [85], 7)
    new perk("Fey Food", "The line between exceptional cooking and a magical ritual is a blurry one, and you know how to push that boundary in a variety of ways. You can produce food that is not only supernaturally delicious, but can act as a medium for a variety of supernatural effects.", 150n, 1n, [87], 7)
    new perk("False Life", "You can create an emulation of life, an enchantment that animates objects and allows them to react to objects according to a fixed, preset personality. Though convincing, these creations are not truly sapient, and operate on a fixed capability.", 500n, 1n, [84], 7)
    new perk("Flight Enchantment", "Taking to the skies is a primal dream of almost every people, to shed the shackles of the earth. It is unsurprising that every magical tradition has some means of allowing flight.  You know a variety of spells and enchantments that allow you to enable things to fly.", 200n, 1n, [85], 7)
    new perk("Speed of The Wind", "You now have knowledge regarding a series of enchantments that allow you to grant objects and their users supernatural speed. While reaching the speed of sound is relatively simply, the complexity quickly grows beyond that point.", 150n, 1n, [85], 7)
    new perk("Invisibility", "The shadows are your friends. It is almost like you have spent a lifetime studying them, gleaning the arcane secrets of stealth from their depths. You have a deep understanding of a class of enchantments that enable stealth, and the foundation necessary to develop more complex and powerful versions of them.", 100n, 1n, [85], 7)
    new perk("Dark Forces", "Perhaps you delved too deep, or passed certain boundaries. You've stumbled across secrets that would be unsettling to most. But they are powerful, and maybe that is just what you need. There is power in shunning the shackles of the mundane, to consider options that most would not.", 400n, 1n, [83], 7)
    new perk("Geas", "You can create an agreement between two or more people that they are forced to uphold. Barring escape clauses written into the agreement at the time of creation, there is no way to break these bonds.", 1200n, 1n, [88], 7)
    new perk("Mystic Materials", "Magic can bring out all sorts of strange properties in otherwise mundane materials. While this is usually due to complex natural processes, you know how to precipitate magic in the structure of previously mundane materials resulting in permanent transformations as magic becomes a permanent part of their existence.", 300n, 1n, [84], 7)
    new perk("Eldritch Mind", "Some people say that there are things that mortals were not meant to know. You disagree, sometimes it just takes a special mind. And you happen to have one such mind, capable of handling even the most unnatural of thoughts", 0n, 1n, [], 8)
    new perk("Equivalence", "It's all the same at the end of the day. Everything at the most base level is energy, and were all once part of a greater whole. You know how to reach back to that primordial state and convert one from of energy into another.", 600n, 1n, [], 8)
    new perk("Though the Dreamer Wakes", "The world may be a dream, you are not... or are you? Perhaps you are simply a thought, some persistent whisper in the minds of the grand cosmic existence. Whatever it is, you can persist past the end of the universe, and await the birth of the next.", 750n, 1n, [104], 8)
    new perk("Strange Angles", "You know there is more to the world that others see, layers and angles to eternity. Strange Places where wrong is right, where shadows are cast over eternal light. Though they may seem as dreams you know what lays beyond the world's seams.", 500n, 1n, [104], 8)
    new perk("Nothing but a shadow", "We are but shadows of something great, a soul perhaps or some other state. There is more than up and down, left or right. There are things move beyond the night.", 500n, 1n, [104], 8)
    new perk("When the stars are right", "The universe extends into places unknown, with existence itself weighing it down. What waters lay at the bottom of gravity wells? A paradise perhaps or unknown hells. When the stars align, streams combine. Trickles gather into torrents and with eerie portents, mysterious machines enact strange schemes.", 500n, 1n, [114], 8)
    new perk("Strange Places", "There are strange places in the world, where doors do not lead where you expect and distances seem inconsistent. Where even trying to map them out can lead to madness. Some are natural, others are not and now you know how to create them.", 250n, 1n, [104], 8)
    new perk("Eldritch Tongues", "There are many languages that mere mortals cannot properly speak, or on some cases understand. Vocalisations beyond the capabilities of lesser beings. That limitation does not apply to you. Not only can you generate any noise that you wish but you can also decipher any language - spoken, written, signed or otherwise communicated - but you also learn them incredibly quickly. As a side effect you can also learn any mortal language with a few hours of exposure and mimic and voice or accent after a few minutes.", 0n, 1n, [104], 8)
    new perk("An extrusion", "The forms that cosmic forces take on in the mortal realm are not their true selves. Such things are too great to exist without destroying existence. Instead, they are extrusions, miniscule fragments of their power, like the end of a pair of tweezers poking at reality. You can now replicate this feat, retracting the majority of your existence into yourself and exposing only what you wish. Should you be strong and mentally powerful enough, you might even be able to summon multiple such extrusions.", 350n, 1n, [104], 8)
    new perk("Laws", "You know how to create spaces with altered physical laws, through  the manipulation of the Aether, you can effectively create spaces where the natural laws are something other than the familiar physics of your universe.", 1200n, 1n, [290], 8)
    new perk("Cosmic Wells", "Beneath all of existence, there exist infinities unseen. There are ways to pierce the limited illusion of existence, calling forth power from beyond what mere mortals are able to comprehend. This can be turned to a variety of ends, though the simplest would be in the form of light and heat.", 400n, 1n, [], 8)
    new perk("Servitors", "Sometimes greater forces cannot act on such miniscule levels, and thus have need of tools with a certain... delicacy. You understand how to replicate these processes, creating constucts with strange capabilities, some that may seem fantastical to your average mortal.", 350n, 1n, [], 8)
    new perk("Altered Existence", "Such menial beings cannot withstand the presence of a greater power. And now that you know how to summon those forces, you can raise these pathetic mortals into something more worthwhile. These new creatures can be stronger, faster, more long lived though may be effected in other ways in a much less predictable manner.", 200n, 1n, [104], 8)
    new perk("A Calling", "Your name is special... No, not your common name. Your full name. You have gained a title, which forms the basis of an Invocation. To use this is to refer to you, and you are aware, to an extent of when it is used. However, when this title is used in conjuction with other ways to identify you (other titles or even your personal name) this becomes a true Calling. A means of granting you awareness of the situation in which you have been invoked.", 300n, 1n, [104], 8)
    new perk("Beneath Notice", "Mere mortals are to cosmic forces less than the least speck of dust is to them. While unsettling, this does have it's advantages, and you can extend these advantages to other levels of existence, rendering yourself so utterly beneath notice that you are effectively undetectable.", 750n, 1n, [104], 8)
    new perk("Warding Glyph", "You can place a glyph, a simple two dimensional shape that extends into higher dimensions. This produces an unpleasant sensation that can effect even Higher Beings, encouraging them to avoid the area. This is not a true defense, however, as it will cruble against any focused effort.", 0n, 1n, [], 8)
    new perk("Walk Upon the Firmament", "You tread not upon the base earth, but upon the foundation of all existence. You an find footing anywhere, even upon the very vaccum of space and be as stable as you would be on solid ground.", 250n, 1n, [104], 8)
    new perk("Cosmic Logic", "At a certain scale, laws once thought invioble are revealled to be... malleable. Your existence is now great enough that your actions and reactions supercede normal reality allowing you enforce your own alien logic on the situation at hand. This is still extremely strenuous so can only be done in short bursts.", 1200n, 1n, [104], 8)
    new perk("Watchers from Beyond", "You gain a limited line of communication to a group of observers from... elsewhere. Though their perspectives are alien to you they are incredibly intellegent and learned, allowing them to comment on your plans and even peer-review your research and designs. They may also occasionally send you small trinkets of snippets of prophecy.", 200n, 0n, [], 8)
    new perk("Outside Influence", "There are signs. There are always signs. Even if you don't know what you are looking for, the simple fact that reality does not align itself with your predictions can only mean that there is something you don't know about. You have a particular talent for noticing such things, and are able to discern the existence of unknown or even hidden influences on a situation with sufficient study.", 500n, 1n, [], 8)
    new perk("Esoteric Affinity", "While you might not know exactly what something is, you can make observations and test theories. It is enough a toehold that with a little experimentation, you can develop technology to make use of any phenomena, regardless of how strange it might be.", 200n, 1n, [], 8)
    new perk("Must Be Seen To Be Believed", "There's a certain... otherness to you. You don't quite fit in with reality. It takes a great deal of evidence for something to accept your existence. And while the human mind has other ways of sharing information, the mechanisims of the world have no such defense. All means of remote viewing and detection will fail, your presence being rejected from reality as it leaves your immediate field of influence.", 750n, 1n, [104], 8)
    new perk("Sterner Stuff", "Sometimes it's simply too dangerous to go alone. Take this. You now are durable enough to survive the passive dangers of any natural environment", 200n, 1n, [], 9)
    new perk("Pocket Planes", "You know how to create limited infinities. Though this void contains nothing at all, it is, ultimately, boundless.", 750n, 1n, [], 9)
    new perk("Material Planes", "You know the mechanics that govern the branching paths of time itself. You understand what it would take in order to access these other worlds and how to navigate this intricate web", 500n, 1n, [], 9)
    new perk("Mirror Planes", "There are many axis upon which the world may turn, and you know how to look across them. There are worlds where seemingly arbitrary factors are flipped, gender, morality perhaps even species. You know how to chart these paths and how they fit in the wider web of time", 500n, 1n, [], 9)
    new perk("A Lonely Spark", "Life... doesn't always find a way. In fact, most of the time it doesn't. The majority of worlds are dead, empty of people and their works, and you know how to access these universes", 500n, 1n, [], 9)
    new perk("The Elemental Planes", "There are worlds out there quite unlike your own, places where simple matter is not what underlies existence. Without that foundation, more abstract concepts may run free producing bizarre and alien realms. Without some way of surviving these distant realms you cannot travel there, but you do know how to connect to these distant worlds.", 500n, 0n, [], 9)
    new perk("The Cycle", "Souls are real, you know that, and through observation of their passage you have become aware of other places they go to, drawn through a mystical network of bonds and connections. You have uncovered how to connect to these afterlives, though surviving there is another matter", 500n, 0n, [], 9)
    new perk("The Bindings", "If all these realms are clustered together, what holds them as such? There is a non-place, a pseudo-existence without an inherent nature. Here even concepts like time are not guaranteed, everything simply EXISTS. You know not only about this place, but how to access it, and how to interact with it", 500n, 0n, [], 9)
    new perk("Planar Ship", "You understand the mechanisms of the boundaries between realms and how to manipulate them in such a way that you can launch a small pocket of existence between them, creating a vessel of sorts that can travel between realms.", 350n, 1n, [], 9)
    new perk("Shift Tool", "Transporting discrete items between realms is often easier than transporting some arbitrary volume, on account of broader interplanar physics. It is these delicate interactions that you now have a prodigious grasp on, allowing you to design systems that allow you to shift objects from one realm to another", 350n, 1n, [], 9)
    new perk("Portal Projector", "In the right circumstances, travelling between the realms can be as simple as taking a few steps. Indeed, in some planes, natural portals exist that make such a thing a simple enough task. It is this phenomena that you understand as though you spent a lifetime researching it, and can now replicate.", 350n, 1n, [], 9)
    new perk("Paramatter", "The nature of realms is a strange one, these adjacent domains where the rules of reality are utterly alien. To most these are entirely separate places, but you now know how to straddle the line between them. At the most basic level, you may simply displace part of an object to the other realm, creating seemingly disconnected pieces that nonetheless move in unison, but should you know of more interesting realms, the object may take on traits from both worlds.", 300n, 1n, [], 9)
    new perk("Farspace", "This realm is an interesting one, with physics and mechanics quite unlike the material realms most are familiar with. Through a series of calculations and manipulations, a properly protected craft or signal can transit through Farspace to locations at an effective speed greater than that of light, often by orders of magnitude. Your grasp of the mechanics of this place is now such that it is only your ability to calculate and generate the necessary effects that limit your ability to traverse real-space.", 200n, 1n, [], 9)
    new perk("Trans-Realm Interstellar Porter", "This realm is an interesting one, with physics and mechanics quite unlike the material realms most are familiar with. Through a series of calculations and manipulations, a properly protected craft or signal can transit through Farspace to locations at an effective speed greater than that of light, often by orders of magnitude. Your grasp of the mechanics of this place is now such that it is only your ability to calculate and generate the necessary effects that limit your ability to traverse real-space.", 250n, 1n, [138], 2)
    new perk("Phase Field", "A phase field is technically a byproduct of true planar technology, and is part of the systems that allow for transit between planes. By stabilising this normally intermediate state, you can control the interactions between an object and it's surroundings, rendering them effectively intangible and only able to touch the things they desire to.", 500n, 1n, [], 9)
    new perk("Hidden Workings", "You know how to project the effects of your creations across planar boundaries, allowing things done in one plane to effect others. This can create seemingly mystical effects, or create devices that seem to be much smaller than they otherwise would have to be.", 300n, 1n, [], 9)
    new perk("Idyllic Retreat", "Due to a confluence of various factors, this plane is particularly interesting. While veritably paradisical due to the inability of anything within to cause serious harm to anything else, this world does have something of a drawback. Nothing can be permanently introduced and only memories can be brought back. Additionally there is something of a stasis that exists, almost as if the world itself is happy the way it is.", 250n, 1n, [], 9)
    new perk("Adaptive Existence", "You can refract yourself, in a way, into a form that better suits the plane you are currently occupying. And, assuming you have a means of calling upon the energies of those other planes, you can also take on these alternate forms elsewhere.", 450n, 1n, [126], 9)
    new perk("Foreign Associates", "When travelling to a new plane, you become aware of a local faction (should any exist) that would be amenable to trade and/or cultural exchange with a reasonable amount of effort. This knowledge is generally limited to their approximate location and a general sense of cultural taboos.", 200n, 1n, [], 9)
    new perk("Flow-gistics", "To work with fluids is to work with change. That is a fundamental truth you must come to terms with. Through exhaustive effort and constant analysis you have come to understand exactly how systems will evolve. As long as you know the starting state of the system you can predict the outcome with only factors you were not aware of altering the outcome.", 800n, 1n, [], 1)
    new perk("Steam Powered", "The advent of steam transformed humanity, allowing them to surpass the limits of flesh and bone. This grants you a fundamental understanding of how steam can be manipulated an put to use. As long as you know what you want to do and it is possible to do so, you find yourself able to produce effective mechanisms. This also extends to broader pneumatic theory employing all manner of compressible fluids", 200n, 1n, [], 1)
    new perk("Hydraulics", "Pistons, compressors and all manner of mechanisms allow for the transmission and transformation of force in its purest form. You have an intuitive understanding of how to manipulate pressure, travel and work of all kinds through the medium of incompressible fluids.", 200n, 1n, [], 1)
    new perk("Macro-fluidics", "You understand the subtle intricacies of working with fluids of all kinds. Not only simple motion but mixing, filtering, transporting and storing these materials on a grand scale.", 200n, 1n, [], 1)
    new perk("Seismo-Fluidics", "The nature of fluids is truly a matter of scale. Across the right timescales and in the right conditions, everything is fluid and you know how to leverage those properties to your own ends.", 200n, 1n, [], 1)
    new perk("Artificial Intelligence", "Beyond logic lies the realm of true intelligence. To be able to learn and act independently of any outside force. You now know that process innately, and are able to create artificial intelligences to whatever end you wish. Though your creations are truly realised people, you know how to construct them to want what you want them to want.", 500n, 1n, [], 1)
    new perk("Semiconductor Revolution", "Making rocks think is frankly magical, a culmination of understanding that seems to run up against the boundaries of the material realm itself. And you are now exceptional at understanding the mechanics, properties and theory behind all of it", 150n, 1n, [], 1)
    new perk("Optical Computing", "Sometimes you need to go fast. Through the complex quantum interactions of electromagnetic waves with various optical medium, you can use light as a medium of logic. You now have a deep intrinsic understanding of how optical interactions can be applied to logical process", 150n, 1n, [], 1)
    new perk("Organo-chemical Computing", "Nature has come up with all sorts of interactions, coming up with a form of intelligence that is extremely difficult to match in terms of capability and efficiency. you can now turn that to your own ends, producing incredibly robust and adaptable biological computers.", 150n, 1n, [], 1)
    new perk("Micro-fluidics", "You understand the subtle intricacies of working with fluids of all kinds. Though generally not considered a medium of logic, fluids have myriad benefits when it comes to working with many classes of problems and can bridge the gap between computation and physical processes.", 150n, 1n, [], 1)
    new perk("Mechanical Computing", "There are many ways to solve a problem, but perhaps the earliest is through physical tools. Be it clockwork or simple geometry, you know how to create physical structures and systems that will produce solutions to the problems you pose.", 150n, 1n, [], 1)
    new perk("Nano-Computing", "You can turn the very building blocks of the universe into a medium for computation. You know the little secrets behind encoding information and processing logic on the scale of atoms themselves.", 150n, 1n, [], 1)
    new perk("Electro-", "You have a deep understanding of the quantized expression of this omnipresent force. You not only know how to generate and manipulate electrical systems, producing intricate systems of interactions, you can also turn them to all sorts of interesting and unique outcomes.", 300n, 1n, [], 1)
    new perk("Magnetism", "You have an unerring understanding of the fundamental properties of this omnipresent force. You not only know how to employ magnetic fields to great effect, but also are able to design complex field structures that can produce all sorts of interesting and unique outcomes.", 300n, 1n, [], 1)
    new perk("And Let There Be Light!", "You are a master of photons, those quantum waveforms that impinge so easily on the material world. You have a deep and intuitive understanding of how photons act and interact with both energy and matter", 300n, 1n, [], 1)
    new perk("Gravitics", "The very fabric of space and time is bent and stretched by every little thing, and you know how to take advantage of that. You know how to replicate artificial gravity wells and hills and even the beginnings of more complex space-time structures", 400n, 1n, [], 1)
    new perk("Massive", "Everything in the universe has mass, energy bound and stabilised. While you do not yet know how to produce or remove matter, there is one aspect you have learned to control. You now know how to manipulate the Higgs Field, altering inertia and momentum to all sorts of ends.", 400n, 1n, [], 1)
    new perk("The Strong", "What truly holds the world together? At the core of every atom lies the strong nuclear force. Limited by distance but immense in strength, you now know how to manipulate it, creating dense durable substances and rendering unstable isotopes safe to handle", 400n, 1n, [], 1)
    new perk("The Weak", "The power that underlies nuclear fission itself. This is a force is uniquely transformative and has myriad uses, and you know just what they are. From accelerating normal fission reactions to the stabilisation of complex nuclear structures, you are able to induce the rare reactions and shape the weak nuclear force to turn it to your own ends", 400n, 1n, [], 1)
    new perk("Blacksmith", "Though fire and force, you shape the very blood of the earth. This grants you the skill necessary to shape metal to your will through various manual tools such as hammers, punches and anvils", 200n, 1n, [], 0)
    new perk("Machinist", "The strength of humanity lies in tools. And you know how to use tools to reach past the limitations of your flesh and bring forth what lies in your mind. You have an eye for precision and an intrinsic intuition on the best materials for the job.", 200n, 1n, [], 0)
    new perk("Carpentry", "Wood is perhaps the first material humanity ever turned to their own ends. Though it may not be the strongest or toughest substance, it has it's own benefits and you know how to bring them forth. You are able to work with any wood producing immaculate and functional works of art.", 200n, 1n, [], 0)
    new perk("Ceramicist", "It takes immense skill and planning to turn what may seem like sludge into some of the most intricate and capable materials in existence, but you have a deep understanding and exhaustive knowledge of this art that makes it seem easy.", 200n, 1n, [], 0)
    new perk("Roping", "From cables to cords, your realm is that of ropes, chains, wires and filaments of all kinds. String is perhaps the tool that separated people from animals, artifice of a kind that seems to be solely the product of an intelligent mind and you know how exactly to make and use it from almost any material.", 200n, 1n, [], 0)
    new perk("Leatherwork", "Perhaps one of the first ways that people protected themselves from the elements. Your skills extend far beyond the simple flayed flesh of creatures, allowing you to easily make use of any thick, flexible material that could be considered 'leather' of some sort.", 200n, 1n, [], 0)
    new perk("Textiles", "You can work with cloth. Be it the finest silk or the most advances space-age fabrics, you know how to get it to do what you want it to do. Be it clothes, sails or even tents, you can make it happen", 200n, 1n, [], 0)
    new perk("Resins", "You have a deep understanding and intuition surrounding the interactions of different polymers and other large molecules, allowing you to design and deploy chemicals that will take on the properties you need once cured", 200n, 1n, [], 1)
    new perk("Glasswork", "This ancient art remains in use to this day. From the lab to industry, working with molten materials especially at the extreme temperatures needed to render glass fluid is a skill that takes a lifetime to master, granting the skills you now have", 200n, 1n, [], 0)
    new perk("Nanofabrication", "From photolithography to chemical resists and even high-precision machining, you know exactly how to produce nano-scale structures through the use of macroscopic tools.", 200n, 1n, [], 0)
    new perk("Nanoengineering", "Working at the scale of atoms and molecules is a whole different ball game. At this scale the classical physics that govern most engineering are flexible and you know how to take advantage of that, producing mechanisms that work effectively on this miniscule scale", 200n, 1n, [], 1)
    new perk("Nanoassembly", "You know how to make the atoms dance. Not only do you know how to direct the nano-bots you can to the best of their abilities, you also know what you need nanobots to do in order to produce objects engineered at the scale of atoms themselves", 200n, 1n, [], 1)
    new perk("Additive manufacturing", "3D printers of all kinds have transformed production, but they come with their own quirks. You know precisely how to make best use of these systems, taking advantage of their strengths and accounting for their limitations", 200n, 1n, [], 0)
    new perk("Biomanufacturing", "The production of complex chemicals and compounds is often best achieved through the use of an organic carrier. You know how to modify simple organisms in a manner that allows you to engineer a system for producing any homogenous substance you care to name", 200n, 1n, [], 1)
    new perk("Sculpting", "Sometimes the page is just not enough. Sometimes your vision cannot be limited to two dimensions. You now know how to render the sights of your mind's eye in physical form.", 200n, 1n, [], 0)
    new perk("Engraving", "From delicate tracery to stark gouges, it does not take pigment to send a message. You know what it means to mark something, beyond simply scratching a line.", 200n, 1n, [], 0)
    new perk("Cooking", "You know what it means to make food. From lovingly personalised home cooking of family kitchens to the standardised perfection of professional outfits, your skills are never found wanting.", 200n, 1n, [], 0)
    new perk("Pharmacology", "The intricate biochemistry of the body is an incredibly delicate dance, and without a clear understanding of how it all interacts you can't be sure how different chemicals will effect the body. However, that is no longer a problem for you. Not only do you have a perfect understanding of the biochemistry of your own body, but are rapidly able to expand that knowledge with a little study of any creature.", 200n, 1n, [], 1)
    new perk("Surgery", "Physically modifying a living creature is a delicate process, one that requires a deep understanding of the intricate systems that exist in every part of a body. But that is not a concern for you. In addition to a perfect understanding of your own body, you can rapidly build on this knowledge with some study of any organism", 200n, 1n, [], 0)
    new perk("Hologram Emitters", "These devices are small concealable projectors, allowing you to generate light in a certain area of effect. You have designs for various classes of these, with various levels of wavelength control, directionality, range and power levels.", 250n, 1n, [], 2)
    new perk("Barrier Generator", "These devices impart a force onto any object within a certain distance of them, the range, maximum strength, directionality and precision are somewhat customisable within the scope of your designs.", 250n, 1n, [], 2)
    new perk("Warp Drive", "This gravitic engine can unlock the stars. Through careful manipulation of the space-time geometry surrounding a craft, you can relocate the contents of a specific volume at what are effectively superluminal speeds. You have a set of scalable designs whose speed depends on the radius of the primary warp coil, a circular structure that must surround the rest of the craft.", 350n, 1n, [], 2)
    new perk("Structure Field Nodes", "These devices vastly augment inter-molecular forces, creating a sort of non-newtonian effect that allows for extremely rapid force dispersal across an entire structure. This in effects causes it to act as a perfect rigid body. These fields require a certain density to propagate and get weaker the further they are from the nodes in question.", 500n, 1n, [], 2)
    new perk("Polycrystalline Hypercomposites", "This class of engineered materials display a wide range of incredible properties. From the tensile strength required to make ringworlds to durability capable of handling relativistic micrometeorites you can produce materials with a wide range of capabilities. Even high temperature superconductors and superlubricants are available to you.", 500n, 1n, [], 2)
    new perk("3D-Computing Substrate", "You know how to create a series of logic gates that allow for the routing of electronic signals in 3D space while still performing logical operations. The real secret, however, is heat management. The materials used not only conduct heat well, but form structures that accelerate heat transfer, allowing for immensely dense computational equipment.", 250n, 1n, [], 2)
    new perk("Logic Crystals", "These crystals allow for the manipulation of light in order to perform complex logical processes across a broad range of wavelengths and polarizations, allowing for an immense speed of operation. However, due to wavelength limits these systems tend to have a fairly large minimum size, even if they are generally faster than other systems of the same volume.", 250n, 1n, [], 2)
    new perk("Superfluidic Gates", "Using precise control over surface tension and flow characteristics, you can create complex computational systems that can even have an impact on the physical world, with a particular strength towards analytical systems. Though the actual moving parts does tend to make them less optimal for pure computation and somewhat more power hungry.", 250n, 1n, [], 2)
    new perk("Hyperdense Neural Matter", "This optimised neurological tissue far surpasses any naturally evolved equivalent. Boasting complex interconnected ganglia and numerous chemical pathways, this provides for an incredibly robust and adaptable system that can be turned to a wide variety of uses. Of course, it does require some more regular maintenance, and can be somewhat less suited for precision applications.", 250n, 1n, [], 2)
    new perk("Reactionless Thrust Modules", "These self contained devices produce thrust when supplied power. The maximum force they exert is dependent on their specific construction, but you have the designs for an entire range of these modules, from small nodes the size of your thumb that can produce a couple dozen newtons to immense engines larger then a small building that can accelerate vessels on the scale of cruise-liners at an entire G of acceleration.", 150n, 1n, [], 2)
    new perk("MyoSyn linear actuators", "These linear actuators have the unique benefit of having a control requirements that very closely mirror biological systems. This massively reduces the overhead that comes with integrating with organic systems, either in the form of cybernetics or through a direct neural interface of some kind.", 100n, 1n, [], 2)
    new perk("Neural Interface", "From sub-cranial implants to simple external probes, you know how to make a number of different neural interfaces, though the resolution depends on the scale of the device and the invasiveness of the operations.", 150n, 1n, [], 2)
    new perk("Quanto-spatial Communicators", "While the precise details of the quantum mechanics in question are still being shaken out, there are some equivalencies between entanglement and wormhole technology. This system allows you transmit information instantly between two linked particles, so long as their quantum states remain linked.", 200n, 1n, [], 2)
    new perk("Fusion Core", "You know how to build various scales of fusion systems that can extract vast amounts of energy from hydrogen - even simple protium. While your containment systems usually limit the amount of energy that you can draw, your larger designs include a 'torch mode' which (while in a vacuum) can open up the reaction chamber to process more fuel. This does reduce efficiency, but can allow for greater power draw and allow the fusion plant to double as a propulsion system.", 100n, 1n, [], 2)
    new perk("Wormhole Gates", "This system allows the creation and preservation of a wormhole, with either end being preserved through a semi-passive frame. As long as the connection isn't disrupted, these can be transported relatively easily and allow for effectively instantaneous transit from one side to the other.", 450n, 1n, [], 2)
    new perk("Legacy", "All of these strange, mystical forces flow within you, growing in power and strength. While normally, it would be for your children to carry forth your legacy unto this world, you may now trigger a similar awakening of one of your powers in others through the means of a ritual.", 0n, 1n, [], 0)
    new perk("Fundamentals", "Congrats! You have all the prerequisites for every other power in the March! As a bonus, you now are now able to pick up the basics of any field in about an hour of focused study", 0n, 1n, [], 0)
    new perk("Sure Footing", "The laws of nature may take on infinite forms, but at the end of the day, you remain yourself. Regardless of the environment that you are able to operate as you wish and even enforce your natural logic should you choose to.", 1000n, 1n, [], 0)
    new perk("All Access Pass", "It doesn't matter if it's an afterlife or some obscure demiplane, you are aware of all the little realms that exist in this universe and can transport yourself to them and handle the environmental dangers with ease.", 750n, 1n, [], 0)
    new perk("Skilled", "There's nothing you aren't at least decent at. You've tried your hand at so many things that your transferrable skills are enough to hum a few bars at practically any skill you are physically capable of.", 500n, 1n, [], 0)
    new perk("From Whence It Came", "You can tell when and where something became what it is. You know who or what is responsible, and get a sense of the raw materials from which it was made.", 1000n, 1n, [], 0)
    new perk("The Process", "You have trained and toiled. Your skills are unfathomable to almost everyone. You are a master in so many skills that you incidental knowledge puts your works so far beyond the best that even exceptional individuals could attempt to make. Anything you create will be the greatest example of it's kind in existence.", 500n, 1n, [], 0)
    new perk("As Clay", "You become able to work with any material as though it is a far simpler version of the same. Complex alloys are worked as easily as steel, dangerous fluids becomes as safe to handle as water and gasses no more difficult to manipulate than simple CO2", 1000n, 1n, [], 10)
    new perk("The Pattern", "Given enough examples of any particular type of object, you can come to know how it works, and if you have the ability to manipulate the substances involved even replicate it. Even without that, you know the capabilities of what you are working with, how to operate it and how to integrate it into your broader technological base", 1000n, 1n, [], 0)
    new perk("The Three Rs", "You know how to make the most of your resources. Often times, the best materials aren't necessary for every application they are used in. You can substitute rare and precious materials for more common ones, retaining the same functionality, though perhaps lacking a little in quality or capability.", 500n, 1n, [], 0)
    new perk("Reclamation", "You are able to quickly and easily reclaim the materials that went into construction of any object, returning them to a form that can be used for future projects", 100n, 1n, [], 0)
    new perk("Teardown", "You are able dismantle and reclaim the components that went into the construction of any object, returning them to a state that can be used for future projects", 100n, 1n, [], 0)
    new perk("Salvage", "You are able to rapidly identify key components and how they are integrated into larger systems allowing you to add them to new systems without a loss in functionality", 100n, 1n, [], 0)
    new perk("Resourceful", "You are able to fine tune the composition of various materials used in the construction of various projects, either doubling effectiveness or halving the material cost.", 100n, 1n, [], 0)
    new perk("Efficient", "You use no more material than is actually needed. You are aware of the precise stress and strain concentrations, allowing you to optimise parts to the nth degree.", 100n, 1n, [], 0)
    new perk("Bespoke", "Whenever you make an object, you can choose to customise it for a specific person, adding structural and stylistic optimizations. In addition to working exceptionally well for that person, it will also last their entire life, should they take good care of it", 100n, 1n, [], 0)
    new perk("Refit", "You know how to upgrade things in such a way that their core essence remains. Regardless of how extensive the overhaul, people will recognise the object as the same thing and it's core spirit will remain not only intact but empowered by the upgrades you made.", 100n, 1n, [], 0)
    new perk("Upgrades", "You know how to upgrade item. In fact, you are so good that the upgrades you make are just as good as if you had built the item with the new features in mind in the first place", 100n, 1n, [], 0)
    new perk("Standards", "You are able to build your systems such that they always remain compatible. Regardless of what changes as long as there is a level of commonality, your systems can integrate seamlessly", 100n, 1n, [], 0)
    new perk("The Raw Materials", "Your products are a cut above the rest. Using materials you have produced allows your products to be twice as good in all aspects, compared to using even the best materials sourced elsewhere.", 750n, 1n, [], 10)
    new perk("Ranching", "Sometimes there just isn't a substitute for the real deal. Animal products have been a core material for all sorts of technologies and now you know how to supply it. You know just how to properly care for creatures of all kinds and gather replenishable materials in an ethical manner. And should it come time for slaughter you know how to do so quickly, without pain and without compromising the quality of the product.", 100n, 1n, [], 0)
    new perk("Farming", "That which formed the foundation of all civilization. That security in knowing that there would be food at the end of the day. You now know how to grow and manage plants of all kinds ensuring exemplary product.", 100n, 1n, [], 0)
    new perk("Mining", "Not merely the process of extracting minerals from natural deposits, but also the means of refining it into a useful state. You have a mastery of this art from planetary depths to the void of space.", 100n, 1n, [], 0)
    new perk("Forestry", "You understand what it means to sustainably manage a resource. You know how to manage intricate systems to ensure they are stable and improve their yield in respect to what you desire from the area.", 100n, 1n, [], 0)
    new perk("Bioculturing", "From fermentation tanks to cultured tissue, you know how to work with organic cells outside of a complex organism, whether that be cultivating them for some product or in order to produce specific tissues you have a deep understanding of how to overcome the challenges involved", 100n, 1n, [], 0)
    new perk("De-Extinction", "A seemingly impossible task. But given the slightest scraps of genetic material, you can replicate a complete viable genome and introduce enough variety to clone a breeding population.", 100n, 1n, [], 0)
    new perk("Terragenesis", "While the idea of terraforming is fantastic, it doesn't take into account the fundamental differences between planets. You know how to create stable ecosystems for any environment.", 100n, 1n, [], 0)
    new perk("Deep Insight", "The means of manufacture leaves its mark, a tell that you can unravel. You may not understand it, but the broad strokes or the procedure, if not the precise things involved can be gleaned with some investigation.", 500n, 1n, [], 0)
    new perk("Pure Industry", "You know how to overcome the challenges that would prevent you from operating at a grand scale. You know how to source or produce the precursors for any technology that you want to produce and how to deliver enough product to fulfil any project. Granted, those requirements may be beyond you.", 0n, 1n, [], 0)
    new perk("A jumble of wires and components", "You know how to design your work such that it is far more difficult to reverse engineer. In fact, it would be easier for most to try and recreate the observed effects than it would be to try and replicate the device itself.", 200n, 1n, [], 0)
    new perk("Industrial Design", "Sometimes, it just isn't enough to make things once. There's a special sort of skill that comes with designing things so that they can be made en-mass, and you now have it. You are now able to optimise designs for mass production, making the right compromises and trade-offs.", 200n, 1n, [], 0)
    new perk("Architect of Civilization", "From villages to archologies, you know how to create homes for people. These structures seem to anticipate the needs and desires of their residents", 200n, 1n, [], 0)
    new perk("Touch the Sky", "You know what it means to build big. The careful balance of tension, stress and strain that lets you build works unfathomable to those that came before.", 200n, 1n, [], 0)
    new perk("Megastructures", "What you do isn't mere architecture, no you work on a scale that few can even comprehend. From orbital rings to dyson spheres, you can work out the precise structures and material properties necessary to make it happen.", 200n, 1n, [], 0)
    new perk("Automotive", "from the simplest set of electric skateboards to the most complex trains, transport over land holds a certain set of challenges, from being able to make things move is an interesting challenge, and one that you now find easy enough to solve.", 200n, 1n, [], 0)
    new perk("Hydronautics", "Whether it is in the water or above it, traversing liquid environments pose particular challenges that you now find quite intuitive, both in terms of hydrodynamics and the chemical challenges of a fluid environment.", 200n, 1n, [], 0)
    new perk("Aeronautics", "Ah, the eternal dream of flight. Lift, drag... even the complex airflow of supersonic and hypersonic travel. There are numerous challenges to overcome as you take to the skies, but they are challenges that you laugh at now.", 200n, 1n, [], 0)
    new perk("Tunnelling", "Sometimes, all you need to do is dig a hole. But moving through the earth is not a particularly easy task. Without some sort of intangibility you need to be able to deal with the solid matter surrounding you, but that isn't a problem for you anymore", 200n, 1n, [], 0)
    new perk("Cosmonautics", "Delta-V. The Rocket Equation. Even with exotic power sources and propulsion systems, space poses the incredible challenges of self-sufficiency and an incredibly hostile environment. Still dealing with the challenges of limited resources comes easily enough to you now", 200n, 1n, [], 0)
    new perk("Wearables", "From smart-watches to power armour, accommodating a user takes a particular set of skills and proficiencies, though that is no longer a problem for you. You can optimise technology for portability and comfort for long term use", 200n, 1n, [], 0)
    new perk("Handheld", "There is a great deal that goes into making technology that can be easily made use of, from ergonomics to portability. You find it easy to optimise technology in such a way that it is incredibly convenient to move around and use.", 200n, 1n, [], 0)
    new perk("Intuitive", "You have a way of designing systems that make them incredibly easy to learn how to use. Indeed, you could hand almost any one of your devices to a toddler and they could get it to do what it is supposed to do with relative certainty", 200n, 1n, [], 0)
    new perk("Signature Style", "You have a signature style, one that is utterly impossible not to recognize as yours and yet impossible to for someone else to replicate", 0n, 1n, [], 0)
    new perk("Do it in style", "Sometimes it isn't just a matter of getting things done, sometimes you need to look good doing it. You can incorporate design elements into your creations that allow them to fit into any aesthetic you can imagine or visualise. This will not alter it's capabilities or functionality - for good or ill.", 50n, 1n, [], 0)
    new perk("It's Next Season Dahling", "You're a trend-setter, aren't you? You can produce designs that are not only beautiful, but are made in a way that people will want to imitate them.", 200n, 1n, [], 0)
    new perk("Monumental", "You can make big things. But that's not always enough. The things you make resonate with people, carving a message into their mind with the same permanence as a chisel in stone. From memorials to monuments your work isn't just beautiful, it sends a message.", 200n, 1n, [], 0)
    new perk("Understated", "You can hide the true power of your works. Indeed, it may not even appear technological, though that does not impair its functional whatsoever.", 200n, 1n, [], 0)
    new perk("Truly Awefull", "Your works can inspire a certain reverence in all those who gaze upon them. Be it devotion or despair, your works burn themselves into the hearts of witnesses.", 200n, 1n, [], 0)
    new perk("Any Sufficiently...", "You know how to make your technology look utterly fantastical... or your magic look entirely technical. To all but the most intense scrutiny, you can make your work resemble an entirely different paradigm", 200n, 1n, [], 0)
    new perk("Instant Classic", "Your works have a beauty that resonates through the ages. The things you make, they never really go out of style.", 200n, 1n, [], 0)
    new perk("Song of the Ages", "You can sing! In fact you can sing amazingly well. Your voice and skill are such that this alone would make your performances almost hypnotic, inspiring emotions and ", 200n, 1n, [], 0)
    new perk("The Core Principle", "Should you encounter something you have never experienced before, you might have once been stumped. But with your understanding of existence, the minor details stand out to you. Perhaps not enough to replicate it, but enough to grasp the basics and work towards uncovering the core mechanisms that underlie what is being achieved", 1000n, 1n, [], 0)
    new perk("Comeback Kid", "It might take a while, but you will surpass every challenger that comes your way. If anyone defeats you in a contest, your potential will grow beyond their skills and your growth will be accelerated. Of course, it might take a while to overcome truly titanic foes but it is nonetheless inevitable that you will as long as you train hard and survive long enough", 500n, 1n, [], 0)
    new perk("Nanomanipulators", "You know how to create macroscale objects that can generate effects on the nanoscale. These precise mechanisms allow you to manipulate individual atoms, and even parallelize operations across billions of instances allowing you to create notable amounts of nano-scale creations.", 1000n, 1n, [], 0)
    new perk("Shop Tools", "From a simple welder to a six-axis milling machine, you know how to create a variety of tools for the manipulation of wood, metal, plastic and various other materials through the various means of subtractive manufacturing and joining.", 200n, 1n, [], 0)
    new perk("Quantum Lithography", "Specially prepared surfaces have any number of uses, from electronics to catalysts for any number of operations. And in most cases, smaller is better. You know how to create systems capable of creating controlled structures on the atomic scale, producing a delicate interplay of materials that can produce a multitude of effects and useful interactions.", 200n, 1n, [], 0)
    new perk("Computer Controls", "While you know how to operate your devices, and may have the skill and precision needed to perform even the most delicate operations, the cost of your time might simply be too great. Automating the various production steps might be initially time consuming but is almost always worth it.", 100n, 1n, [], 0)
    new perk("Precision Deposition", "From 3D printers to atomic fabricators, the processes underlying additive manufacturing require tools that can build up material into a variety of forms. You now know how to make a wide range of systems that would enable this style of manufacturing.", 200n, 1n, [], 0)
    new perk("Mystic Warrior", "Most mages find themselves out of their element in the chaos of close quarters combat. Not you though, not only do you find it easy to use magic to augment your physcial capabilities, but you also understand how to modify and adapt other spells for quick casting and close range use", 250n, 1n, [], 0)
    new perk("Magitechnology", "You know how to meld the mystic and the mundane, seamlessly integrating magic into various other contraptions, allowing you to take advantage of arcane and technological principles in the manner that best addresses the situation at hand.", 400n, 1n, [], 0)
    new perk("Natural Language Interface", "This system takes advantage of a variety of tricks to allow for the transcription of simple natural language into a series of operations that can operate computer system. This interface can analyse the current state and make generally accurate action to produce the desired result.", 600n, 1n, [], 0)
    new perk("Clear Communication", "You have a way with words. You get your message across in a manner that it cannot be misunderstood, the very essence of your intent seemingly forced into the minds of those who listen. This also makes you an incredibly effective teacher as you can communicate complex topics in a manner that anyone can understand.", 100n, 1n, [], 0)
    new perk("Master's Qualification", "You have gained a level of education in a certain subject that would make you a master in that field. You even have the paper to prove it. You have a certificate that will be accepted by any relevant power that you have the relevant qualifications and it will pass any forms of validation check.", 0n, 0n, [], 0)
    new perk("Incredible Intellect", "Your mind is effectively unparalleled. By any metric you might just be the most intelligent person around. Your memory is edict and your logical process flawless. There are few, if any that  could come close to keeping up with you.", 300n, 1n, [], 0)
    new perk("Prerequisites Met", "You have the base fundamental qualities necessary to gain or develop any non-unique skillset.", 1000n, 1n, [], 10)
    new perk("Crafting Stations", "Regardless of how many people are technically required to operate any tool or piece of equipment, you find that you can fill the slots perfectly well.", 200n, 1n, [], 10)
    new perk("10x", "You get shit done. It isn't just a matter of working ten times faster than someone else, your creations themselves work ten times faster, or ten times more efficiently if you so choose", 1000n, 1n, [], 10)
    new perk("What Overtime?", "You get your work done. Your work faster than most, and find yourself rarely wanting for time. Where others may struggle to complete a task, you are able to complete it in short order. You complete work as though you had an extra hour for every hour you work, at the same quality you would have before.", 100n, 1n, [], 10)
    new perk("Battle Reflex Mode", "You gain an complete understanding of the family or ki techniques coloquially known as Battle Reflex Mode. The name is something of a misnomer, as it focuses on the use of Ki to improve mental processing speeds and augment your body well enough to keep up with it. The extent to which you can accelerate yourself, and for how long is dependent on your reserves and control, but at a base, you could double your speed for an hour, or make yourself five times faster for a minute", 200n, 1n, [42], 5)
    new perk("Crunch Time", "You can push yourself further than most. Through grit and determination you can get triple the work done than you could have otherwise", 300n, 1n, [], 10)
    new perk("Sleight of Hand", "You get things done faster than most people could even see you work. Indeed, it seems like for everything you do another thing is already done, halving the time it takes for you to finish your work. You're also really good with magic tricks", 100n, 1n, [], 10)
    new perk("Oh How The Time Flies", "Time just passes differently when you are working, doesn't it? While you are focused on a project, time seems to flow five times faster both for you and your work", 300n, 1n, [], 10)
    new perk("In all my years", "You work with the skill and efficiency of a seasoned professional. You can diagnose problems with the slightest sound or smell - all it takes is the slightest hint - and you complete your work with no chance of error. All those little things add up, quartering the time it would take for you to get your work done", 200n, 1n, [], 10)
    new perk("Me and me and me and me", "You can work as four people. Quite literally, you can separate yourself into four identical bodies with a shared mind, allowing you to tackle bigger projects.", 400n, 1n, [], 10)
    new perk("Something to remember you by", "Sometimes you meet an exceptional individual, a fundamental facet of reality. Should you form a bond with those entangled with fate, you can call upon a morsel of their power. Perhaps not the full strength of their power but something iconic nonetheless.", 500n, 1n, [], 10)
    new perk("Breathing Room", "When you win a Prize, the world seems to slow to a halt for a few moments, letting you consider the impact of your decisions. You might be unable to move but for a few minutes, you are safe to focus your full attention to your new acquisition.", 25n, 1n, [], 10)
    new perk("Supplies", "For any material you could have infinite access to, you now simply do. You gain a supply of every material that you have access to that grows in quantity as though you were constantly working to grow it through your various powers", 750n, 1n, [], 10)
    new perk("Batch Job", "The tedium of making a single part over and over again is often something that crafters need to get used to. But not you. You can choose to have four extra instances of the same item be created when making one", 300n, 1n, [], 10)
    new perk("Production Run", "Sometimes you just need more than one of something. In this case, you may choose to produce 12 additional instances of the same item when making one", 500n, 1n, [], 10)
    new perk("Mass Production", "Outfitting an army is a challenge of logistics and time. While this won't help with the logistics, you can choose to have an additional 99 instances of an item you create be produced when you create one.", 1000n, 1n, [], 10)
    new perk("Make it Bigger", "There are challenges that come with working on a larger scale. The square cube law is a bitch ain't it. But you know how to get around that. How to push materials to their limits through careful design.", 500n, 1n, [], 10)
    new perk("Scale Model", "Isn't that train just perfect? You could almost see it riding real tracks. Actually, you could. At your command, upon completion objects will grow to 22.5 times their original size in every dimension", 500n, 1n, [], 10)
    new perk("Make it Fit", "Sometimes it's hard to squeeze everything you need into a tight space. But you know the tricks, having various parts pull double, triple or even quadruple duty in order to squeeze in far more than you normally could", 500n, 1n, [], 10)
    new perk("Honey, I shrunk the things", "Sometimes, you just need to keep things compact. At your command, you can shrink things to 1/22.5 of their original size in every dimension upon completion.", 500n, 1n, [], 10)
    new perk("Nanoscopic Vision", "Your senses can operate on a scale far below the notice of any human. With a moment's focus your eyes can pick out individual organelles and even note the molecular machinery that makes it function. The rest of your senses are similarly enhanced.", 500n, 1n, [], 10)
    new perk("Metatool", "As your skills grow, you keep finding tools that become integral to your work. From oscilloscopes to gravity wrenches to nano-manipulators your kit grows larger and more unwieldy as your capabilities grow. This tool can absorb any tool into itself and transform into them whenever necessary", 750n, 1n, [], 10)
    new perk("Tiny Raccoon-like Fingers", "You can get into all of those small hard to reach places and easily manipulate tiny parts. Your dextrous fingers manipulate objects with an ease and precision that would suggest that they are five times the size they would otherwise be", 50n, 1n, [], 10)
    new perk("Fractal Fingers", "Well, not just fingers. Your hands are now capable of limited shapeshifting, allowing you to manifest relatively simple tools. Nothing capable of any advanced logic, but everything from a hammer to a voltmeter are at your fingertips", 200n, 1n, [], 10)
    new perk("Warrantee", "When made in a workspace that you own, you may choose to imbue objects with a degree of self-repair. The devices made this way will repair themselves in at most 168 hours, less if the parts are in proximity. Any parts that are inaccessible will relocated piecemeal whenever they are unobserved, and will end up in increasingly unlikely scenarios to become unobserved as the deadline approaches.", 300n, 1n, [], 10)
    new perk("Maker's Mark", "You now have a mark, and emblem born of your very self that now exists on anything you make. This mark is unforgeable and allows you to know where the object is whenever you desire.", 100n, 1n, [], 10)
    new perk("Conversion", "All of these different energies can get confusing. Well no more. Your power has grown to the point that the differences between things like magic and ki are subsumed under your power. All supernatural energies are the same to you.", 1000n, 1n, [], 10)
    new perk("Life Energy", "You know how to distil pure life energy from living things of all kinds, though more complex and longer lived life forms tend to be richer in the stuff. In base form this is already a potent restorative, improving healing and fighting off the general maladies of old age for a while.", 200n, 1n, [], 2)
    new perk("Aether", "This primordial stuff is not matter in truth. In many ways, this could be said to be purified untainted 'existence'. It is in this substance that the laws of the universe are written", 1000n, 1n, [], 2)
    new perk("The Maw", "This is the ultimate fate of all things. When the clockspring of the universe is spent, this is all that remains. And as everything must become it, you know how to turn anything into it.", 1000n, 1n, [], 2)
    new perk("Quantum Nanobots", "In your mind exists the designs for a great and terrible things. A class of automata that exist beyond the base definition of nano-bots. These are less physical constructs and more carefully altered segments of the very fabric of reality that can be commanded to alter matter on a subatomic scale.", 1200n, 1n, [], 2)
    new perk("Distilled Darkness", "You know how to condense the void of darkness into a form you can manipulate. Something like a supercritical fluid this substance can be used for a variety of purposes, but the simplest will consume light that touches it.", 200n, 1n, [], 2)
    new perk("Liquid Light", "You can precipitate photons into a concentrated fluid-like substance. Though this has many uses, the simplest is to let it evaporate into light, which it does relative to its surface area. You also gain the knowledge needed to properly store and preserve this substance to prevent unwanted degredation, as well as how to reverse this process.", 200n, 1n, [], 2)
    new perk("Spacetime Fabric", "You have a method of extracting segments of the very fabric of space and time, allowing you to render them down into two-dimensional representations you can easily manipulate. When this process is reverted, it reintegrates into the universe, causing intense gravitational waves unless it takes the shape of some stable structure.", 200n, 1n, [], 2)
    new perk("Potion of Spiritual Form", "Most souls require a physical form to resist the natural spiritual flows of their universe and remain 'alive' but there are ways around that. You can brew a potion that maintains your physical body and grants your soul the ability to wander freely for a time in a sort of ghostly state", 200n, 1n, [], 2)
    new perk("Cosmic Conveyance Core", "You know how to create a device, that when built into a spacefaring vessel and provided enough power can allow it to travel through a realm at impossible speeds. Indeed, this system can allow a craft to traverse the observable universe in but a single century.", 1000n, 1n, [], 2)
    new perk("Oracle Machine", "You know how to grant a machine the gift of foresight. The effects of this are limited, only allowing them to detect their own future state, but that is itself immensely useful. This allows a device to massively accelerate it's operation by getting the result of an action before it even happens.", 1200n, 1n, [], 2)
    new perk("Temporal Substitution Translocation Array", "Through a complex combination of various technologies, you can switch an individual that died with a simulacrum of their body through time and space. In doing so, the device thus effectively 'resurrects' those who have died, whisking themselves at their very last moments. The simulacrum takes advantage of the restorative temporal forces to become able of passing practically any test or examination", 750n, 1n, [], 2)
    new perk("Simulation Space", "Through a combination of magic, alchemy and technology you are able to create a sort of programmable room, which can replicate any environment and even simulate the presence of others.", 500n, 1n, [], 2)
    new perk("Adaptive Environmental Shell", "The AES is what happens when form and function meet. Through various means, this shell can replicate any outfit, and seamlessly modify them in order to provide the coverage and protection needed in order to survive any environment. ", 200n, 1n, [], 2)
    new perk("Universal Translation Devices", "These devices make use of psionic principles to facilitate communication without any chance of misrepresentation . This system works in real time, translating even parts of the sentence that haven't been said yet.", 300n, 1n, [], 2)
    new perk("Full Body Prosthesis", "This set of cybernetics is everything needed to replace every last cell of the body with an engineered replacement. Even the brain can be converted (through the use of nano-bots in order to improve function.", 500n, 1n, [], 2)
    new perk("Certified Confidential", "This system was developed... somewhere in order to allow for secret agreements that need to be made. Through the use of various psionic markers this beacon can destroy all memories made within a certain distance of it while it was active utterly irreparably. ", 100n, 1n, [], 2)
    new perk("Adaptive All Purpose Tool", "The AAPT system is a easily portable set of high-detail force-field generators, hologram projectors, sensors and additive manufacturing tools that can replicate a wide range of hand tools and perform on-site temporary repairs for a wide range of common problems.", 200n, 1n, [], 2)
    new perk("Complete Immersion Simulation System", "The Complete Immersion Simulation System is a form of complete sensory replacement device that allows a user to interface with virtual environments. The designs you have are flexible enough to be adapted to pretty much any body type.", 300n, 1n, [], 2)
    new perk("Event Proxy Analysis Recorder", "This is not so much a sensor as it is an 'echo' of an extant event. The records it makes, when analysed by any form of study, generate results identical to if you had examined the effect directly. However, due to the nature of the recordings, the recorders are limited to events that occurred within a few hundred meters.", 750n, 1n, [], 2)
    new perk("Preservation Pods", "These containers effectively stop time for anything stored within them. Just remember to label them - the field turns the  outside surface of the preserved volume into a perfect mirror, so figuring out what is inside can get a bit tricky.", 300n, 1n, [], 2)
    new perk("Assistive Drone", "This autonomous platform has a surprisingly high-detail force-projection system and a reactionless drive highly optimised for its size. Paired with the on-board computing resources it makes the perfect helper-bot. By default it comes with a simple verbal interface that can have it move and carry various objects though it isn't very smart.", 100n, 1n, [], 2)
    new perk("Familiar", "You know how to form a magical and spiritual link with a creature, granting it a portion of your power while allowing it to act as a focus for the rest of yours. You can even facilitate this process for others, though it always must be accepted by both parties.", 200n, 1n, [], 2)
    new perk("Inner World", "You have the designs for an artificial demiplane, a limited volume of space that acts as though it was it's own universe. The exact design is somewhat random, but is themed based on various workspaces and environments.", 500n, 0n, [], 2)
    new perk("Subtle Instruments", "There is a time for grandstanding, and there is a time for subtlety. From multi-stage poisons to subtle suveilance devices and even devious traps, you know how to create tools that enables covert action of all kinds.", 200n, 1n, [181], 0)
    new perk("Engineer", "You know the limits of the physical world, and are able to leverage them in such a way as to handle the forces and stresses needed to complete a job. Indeed, your only limitations are the resources you have available to you.", 100n, 1n, [], 0)
    new perk("Chemist", "Be it electrolytes or solvents, adheisives or sealants, it takes a great deal of skill to work with the chemical properties of substances of all kinds. You are bestowed with a deep understanding of how to produce and leverage complex chemical compounds and coctails for all sorts of applications.", 100n, 1n, [], 1)
    new perk("Materials Science", "You know how to engineer substances with distinct physical properties, allowing you to create materials that serve the purpose you intend effectively.", 100n, 1n, [], 1)
    new perk("Hyper Capacitors", "You know how to make systems capable of storing up large amounts of energy and releasing it at practically any rate demanded of them.", 100n, 1n, [315], 2)
    new perk("Power Vault", "You know how to create systems capable of storing vast amounts of energy for long periods of time. These systems scale incredbly well and can handle extended power draw, providing a steady supply of power for almost any purpose.", 250n, 1n, [315], 2)
    new perk("Emergency Defense", "Sometimes, you simply don't have a weapon on hand. Whether it is because you were captured or simply thought you were safe, there comes a time to use what you have available to you. Only that isn't a problem. You know how to use practically anything to its full effect in combat.", 400n, 1n, [], 0)
    new perk("Circles and Cycles", "Cyclic motion, a core facet of how the very universe functions. Your understanding of this grants a great deal of insight into the generation and effects of oscillations and vibrations of all kinds", 300n, 1n, [], 1)
    new perk("Waves", "It is odd, how many different phenomena propagate as waves, from light to sound to gravity itself. You have gained an insight into these phenomena that allows you to generate and predict such events with ease", 300n, 1n, [], 1)
    new perk("Sap of the World Tree", "This amber-like substance is a stable, solid form of spiritual energy. Far more dense than Ichor, though perhaps slightly harder to work with, it is nonetheless incredibly valuable to those who know what it is. You know how to make it from and sublimate it back into spiritual energy", 500n, 1n, [0], 2)
    new perk("Phantom Limbs", "You know how to integrate technology in a way that connects to a host soul and perhaps even combine with it given enough time. To use them is natural, as though they were always part of the user", 200n, 1n, [0], 3)
    new perk("Self-Evident", "You can grant your creations and aura of sorts, a presence that is undeniable even by the staunchest non-believer. It marks your creations as important and valuable, perhaps if only as a representation of something greater", 200n, 1n, [1], 3)
    new perk("Programmed Action", "You know how to generate intent. This allows you to command a body through a mind you have access to, causing it to undertake a sequence of actions precisely as you intend with no input from the host mind.", 200n, 1n, [22], 4)
    new perk("Shared Dreaming", "There are ways to build on emotional connections, reinforce them through psionic means. For those that have strong enough bonds to provide sufficient foundation, you can link the subconscious minds of two people, allowing them to share dreams. For those who can lucid dream, this becomes an avenue of communication that is unbound by distance.", 200n, 1n, [22], 4)
    new perk("Gifted Student", "You can pick up anything with only a little instruction. In fact, you are practically a sponge. Though this works best with martial techniques, your ability extends to any educational endeavour", 200n, 0n, [], 5)
    new perk("Like a Steel Trap", "You have a mind well suited to alchemy. Not only can you hold incredibly complex alchemical processes in your mind with ease, you can also perfectly memorise and visualise complex structures perfectly with but a single glance", 0n, 1n, [], 6)
    new perk("Mystic Triggers", "You know how to set up magical effects so that they will trigger when they receive the appropriate stimulus. What that stimulus is? Up to you! The actual techniques place no particular importance on what they might be.", 300n, 1n, [84], 7)
    new perk("Elemental Affinity", "Magic might be Effect; your will be enforced upon the world. But some things are easier than others. You have found that there is a certain class of effect that is easier to bring about, though this may fall under a traditional 'element' in some schools, in truth the element depends heavily on the individual in question. You gain a new element each time you receive this prize", 250n, 0n, [83], 7)
    new perk("Unknowable", "You can implement principles in your technology that mortal minds cannot hope to process. Attempts to reverse engineer technology using these principles will drive those who attempt to do so mad", 250n, 1n, [104], 8)
    new perk("High Energy Physics", "You have gained a deep insight into interesting high-energy phenomenon, and how they interact with the subtle differences between different cosmologies. This allows you to adapt and make the requisite substitutions to allows complex technologies to work across different laws of physics", 500n, 1n, [], 9)
    new perk("Actuators", "You know how to turn power into motion. From motors to linear actuators, you have a knack for turning any source of energy into forces that can be applied to the rest of the world", 200n, 1n, [], 1)
    new perk("Plasma logic", "You know how to take advantage of subatomic particles to perform logical operations. From vacuum tubes to ion-channels you know how to make use of high-energy physics to perform computation. Though power-hungry, this form of computation excels at rapid analog operations.", 150n, 1n, [], 1)
    new perk("Plasma Manipulation", "Working in High-Energy regimes is difficult. Your substrate is quarrelsome and has the power necessary to fight back. Still, you know how to effectively shape and direct plasmas and ion streams of all kinds, enabling you to take advantage of the unique properties of these substances", 200n, 1n, [], 1)
    new perk("Thermodynamics", "Heat, both prized and dreaded. A necessity in some situations, a bane in others. You have a deep understanding of this phenomenon and how you can effectively manipulate it, concentrating it, dispersing it or simply transporting it from one place to another", 200n, 1n, [], 1)
    new perk("Biointegration", "You know how to work with biological systems, creating technology that will easily interface with it. From simple replacement bones to complex cybernetic augmentations that grant entirely new senses - you are more limited by the rest of the system than any integration issues", 200n, 1n, [], 1)
    new perk("Modular", "It is difficult to create the perfect set of capabilities for every situation, the sheer variety of necessary functionalities hindering the overall efficacy of any solution. As such, you need to be able to tailor your options to the scenario at hand. You have a knack for designing systems in such a way that they will be able to act in concert without any loss in overall capability due to their modular nature", 200n, 1n, [], 0)
    new perk("Multi-mode", "The overall structure of any particular object can affect it's functionality, improving and limiting its ability to operate in different environments and situations. However, while this cannot be overcome, it can be... bypassed. You know how to create systems that will reshape objects, allowing them to take on several different forms, better suited to different purposes without hindering their capabilities in other situations", 200n, 1n, [], 0)
    new perk("Logistics", "Though they may not be truly physical, the greatest challenges will always be logistical. Simply moving large amounts of stuff from one place to another requires understanding the resources available to you and how to best deploy them. You have a particular knack for this, not only in using extant systems, but how new factors will effect these systems and where the greatest roadblocks are", 350n, 1n, [], 0)
    new perk("The Little Things", "Sometimes simply paying attention to the everyday wonders is all it takes to uncover a hidden world. You are quite observant, and have a good head for causality. With a little focus you know what the major contributors to any specific outcome are, and have a good idea how they work", 200n, 1n, [], 0)
    new perk("The Latest and Greatest", "You always learn from your mistakes, even if they might seem minor. Whenever you make something, it is better than any previous example given the same time and resources. Whether that means being made faster, or being better at its job depends on your personal goals", 200n, 1n, [], 0)
    new perk("Mega-Machines", "There's only so much power you can pack into a certain amount of space, but at the same time, working on such large scales can get incredibly difficult. You now have a head for such things able to scale up the size - and thus effects - of your creations as far as you wish", 200n, 1n, [], 0)
    new perk("Mini-Machines", "There's something to be said about subtlety. Brute force isn't always the solution to every problem, and often times you simply don't want to make a mess. This allows you to scale down your creations, replicating the same functionality at smaller scales", 200n, 1n, [], 0)
    new perk("Lucky Break", "Research often depends on that one chance encounter. Sometimes it's a mistake, sometimes it is simply catching sight of a rare phenomenon. But that seems to happen more often than you. Odd, unlikely events just seem to happen when you are watching.", 350n, 1n, [], 10)
    new perk("Spatial Bounce-back Propagators", "You know how to create systems that can transmit packets of space at a faster-than-light speed and 'bounce back' after reaching a specific range. This allows signals and various events to operate at a range, allowing you to 'propagate' the effect of sensors at FTL speeds", 400n, 1n, [], 2)
    new perk("FTL Deep Space Telemetry", "You know how to create devices that take advantage of hyper-planer properties to gather data about the structure of space-time faster than the speed of light. Detecting curvature that would produce an acceleration greater than 0.01Gs is possible out to ten lightyears", 200n, 1n, [], 2)
    new perk("Interstellar Transceiver", "These devices transmit a signal through farspace and can capture similar ones, allowing omnidirectional communication at trillions of times the speed of light. You have designs capable of handling the power necessary to broadcast over ranges that begin at interstellar and reaching up to the local group, the propagation rate multiplying over the speed of light a thousand times at each level", 300n, 1n, [], 2)
    new perk("Precision Clocks", "These clocks take advantage of precise quantum phenomenon that allow them to measure the local progress of time on a Planck scale. You can create these systems, allowing you to track how long has passed since their creation to whatever extent is physically possible.", 25n, 1n, [], 2)
    new perk("Inertial Unifiers", "You know how to create devices that can project a field which transmits force throughout its volume in such a way that results in uniform acceleration. You have designs that scale from a few kilonewtons to the forces needed to propel spaceships at incredible speeds", 150n, 1n, [], 2)
    new perk("Farspace Transit Window Generator", "This series of devices allows objects to transition in and out of Farspace, allowing them to travel across realspace at faster-than-light speeds. You have the designs for a range of such devices, from small units suitable for courier drones to massive systems intended for use in colony-ships", 250n, 1n, [], 2)
    new perk("Fission Works", "You have the designs, knowledge and training to make all of Fission Work's wide gamut of fission-based nuclear reactors and radioisotope thermoelectric generators - ranging from muncipal solid-core designs to gas-core fission and ultra-light manportable nuclear power units.", 150n, 1n, [], 2)
    new perk("Mechatronics In Motion", "You are inflicted with a dream, a dream of a love-letter to the Human form, arms and legs made mobile through designed artifice, then cladded in armor, and moved by mechanisms fueled by engineered power sources. Designs of leg, and arm drive trains come to you, as is the dizzingly complex systems or software required to let it keep it's balance, and most importantly - to move. This is the skill to make arms and legs that work like a human reflected into your chosen mechanical art, but other 'exotic' forms are not too hard to puzzle out, so long as they got something like legs and arms.", 200n, 1n, [], 1)
    new perk("Soul of the Engine", "You know how to design and make the gamut of techniques of garnering energy from combustion - engines, fuel cells, turbines and all. If it burns, you can think of a few ways to make it into motion.", 200n, 1n, [], 1)
    new perk("Power To The People", "There are a great many ways to provide municipal power to a town, a city, a country, or even a world. The Civil Engineering required to tap into Geothermal springs, or truckloads of coal, or a fusion reactor or any large-scale municipal power system into the electricity fed to the needs of the people come to you easily.", 200n, 1n, [], 0)
    new perk("Accelerate the Projectile", "Bolts, Arrows, Bullets, Flechettes and more are all under your perview. You have a grasp on engineering everything required to make a device capable of launching a projectile using explosive-combustion or muscle-power in its many forms. Using more exotic acceleration methods come to you more easily, as well.", 100n, 1n, [], 5)
    new perk("Talk and See with Radios and Lasers", "You have the knowledge of using Electromagnetic frequencies, most often Radio and Light waves, to communicate, and sense. This most often manifests in radio wave and laser communication, and RADAR/LADAR systems. Necessarily, this comes with the knowledge to protect and counter against such equipment, like using Electromagnetic Countermeasures or Electromagnetic Pulse Generating weapons.", 200n, 1n, [], 0)
    new perk("Make Your Artifical Gravity", "The applied engineering of scientific study of Gravitics made manifest - A series of designs towards supplying artifical gravity deck-plates, mass-tractor beams, kilometers wide inertial syncronization fields, and crude examples of gravitic weapons that show effective performance comparable to magnetic railgun weapons due to their imprecise manipulation of the gravitational fields that would otherwise be implemented into pinnacle weapons. You can make a devestating maul with this.", 175n, 1n, [], 0)
    new perk("Song Series Weaponized Accoustics", "The sonic weapons of a enlightened era, including examples of precise narrow-beam sonic pulse weapons capable of nonlethally disabling a targeted individual through lighter armor by temporarily shutting down their nervous system. Comes in a wide variety of packages most of them man portable, as well as more primitive examples that are only effective against targets that can hear with more traditional effects-- afflicting nausea and hearing loss.", 150n, 1n, [], 2)
    new perk("Ink to Paper", "The gamut of designs to put printed materials into the hands of the people are available to you, running from primitive printing presses on parchment to typewriters and ball-point pens to cutting edge paper-preparing chemical processes, and full color gloss printers. the many, varied steps of turning raw materials into the written word (or picture) are available to you.", 100n, 1n, [], 2)
    new perk("The Coastguard Supply", "A coastguard requires a great many vehicles, equipment and systems to run, ones that you do not have to make designs for now. You have been given all the tested and used designs on functional ships, boats, buildings, helicopters and the varied equipment that would enable the day to day operations of a coastguard or similar nautical rescue service.", 100n, 1n, [], 2)
    new perk("Antimatter", "Antimatter is volatile, and the ultimate storage mechanism for harnessable energy in hard-science environments. You know the science behind how to produce, store, and harness antimatter in all its various quantities. the smallest amounts are most economically usable for radiation medicine, but higher orders of magnetitude have obvious manufacturing, scientific, and miltiary applications.", 200n, 1n, [], 1)
    new perk("Subtle signals", "You can pick up what is being put down - to an extent beyond what is merely physically possible. This not only allows you to understand the subtle nuances of communication, but also absorb and assimilate the psionic component making you a better student.", 150n, 1n, [22], 4)
    new perk("Universal Simulation Module", "You know how to create a extremely computationally intensive software package that can simulate the local universe with respect to the actions of the people inserted into it. Your understanding of this system allows you to identify various components, allowing you to extract internal functionality for any other purpose.", 750n, 1n, [], 2)
    new perk("Precision Body Control", "You know how to use meditation exercises and careful training to develop incredible control over your body - first on the level of individual voluntary muscle groups, then to the level of nomally subconcious aspects such as metabolism, then to normally involuntary processes such as your heartbeat and hormones and finally on a cellular level", 200n, 4n, [], 5)
    new perk("Logic", "You know how to describe problems in a rigorous manner. Though this may seem a simple thing, this allows you to break down complex procedures as a simple set of logical processes which are easily achieved through computation of all kinds.", 200n, 1n, [], 0)
    new perk("Shapeshifting", "You know how to create spells and enchantments that allow the target to take on another form, first simply others of their own kin, then any others of their own kind (animate remains animate and inanimate remains inanimate), then finally anything at all", 250n, 1n, [83], 7)
    new perk("Mystic Alchemy", "You know how to take your akills into a realm that is often beyond the reach of most alchemists. To effect the world beyond the physical and reach for what lies beyond the material world. This allows you to apply alchemical principles to various supernatural forces, starting with Ki, then magic, then spiritual energy and finally the conceptual underpinnings of reality itself.", 300n, 4n, [83,0,22,42], 6)
    new perk("Spiritual Entities", "You know how to create independent spiritual entities, self contained souls with enough power to act upon the physical world. These are fully independent entities with agency and the ability to act on your behalf or those who you assign them to, while still remaining undetectable to anyone without spiritual senses.", 350n, 1n, [5], 2)
    new perk("Spiritual Guardians", "You know how to create autonomous subsections of a soul, granting it a protector and guardian that works constantly and independently of the soul itself. These guardians are not actually seperate from the soul and can grow alongside it.", 350n, 1n, [5], 3)
    new perk("Splicing", "You have a deep understanding of how genetics translate into phenotypic expression. It takes you only a little experimentation to isolate what specific gentics are resposible for various biological structures and you have a knack for integrating those same structures into others - even into mature specimen.", 200n, 1n, [], 1)
    new perk("Kaiju", "There are creatures, monstrous creatures that defy any extant concept of biological limitation. You understand these creations, allowing you to creatures of immense size and strength.", 350n, 1n, [104], 8)
    new perk("Unending Endurance", "Regardless of how long you have been working, and how much you have been exerting yourself, so long as you are in good health you can continue to work. This removes your need for food and sleep.", 200n, 1n, [], 10)
    new perk("Hammerspace", "You understand the delicate interactions between the chaotic environs of a living body and the dimensional weft of pocket realms, allowing you to understand how to anchor such constucts into living beings and grant them to easy control, allowing them to store items in a convenient and weightless manner ", 300n, 1n, [], 9)
    new perk("Impossible Proportions", "You know how to alter the internal geometry of beings and objects in such a way that allows them to take on forms far larger than they seem to be able to at first.", 250n, 1n, [], 9)
    new perk("Spooky Action", "You have a good sense of how to generate forces at a distance, from telekineisis to dealing damage directly, you can easily design spells and artefacts to achieve these feats.", 150n, 1n, [84], 7)
    new perk("Mystic Places", "Anchoring magical effects to places is no mean feat - indeed most such places are born of immense magical exposure over a great deal of time. Still, you know how to tie your workings into the ambient supplies of magic making them self-sustaining", 300n, 1n, [84], 7)
    new perk("Pulsar Series Laser Weapons", "From side-arms and concealable hold-outs to static emplacement and void-navy class weaponry, this series of laser weapons are decent examples of all scales of weaponry.", 150n, 1n, [], 2)
    new perk("Accrection Series Plasma Weapons", "This collection of plasma weapons contain everythign from melee hold outs to orbital defence weapons. Though not the apex of this class of weapon, they do represent a collection of decent designs that could fill practically every need for an interstellar war-effort", 150n, 1n, [], 2)
    new perk("Sol-Series Fusion Plants", "These collection of General Hydrogen Fusion Plants provide plenty of options from personal portable units to plants that can power colony craft and can produce a respectable amount of power from any form of hydrogen. Indeed, you also have a number of options for open-chamber designs that can double as thrusters.", 150n, 1n, [], 2)
    new perk("Sunshine in a Can", "You know how to create a large variety of fusion explosives for uses that range from civilian to strategic. These can scale from man-portable anti-materiel grenades to black-navy straegic weapons capable of destroying orbital installations. In addition to the plans, you also have the knowledge neccessary to put them into practice.", 150n, 1n, [], 2)
    new perk("Big Red Button", "You have access to the plans and understanding necessary to make a wide variety of fission-based weaponry, capable of acting as tactical munitions to strategic options - on a planet and even beyond it. Indeed, this collection even includes systems that could be used for civilian purposes, though only if the timeline accounts for the fallout.", 150n, 1n, [], 2)
    new perk("Splitting", "You know how to work your way into weaknesses, applying devasting force from within. You can create all sorts of tools to take advantage of this effect.", 25n, 1n, [], 0)
    new perk("Slicing", "You know how to take advantage of the force you can produce over time concentrating and building up damage until you overcome your opponents defences. you know how to create all sorts of tools that take advantage of this effect.", 25n, 1n, [], 0)
    new perk("Piercing", "You know how to concetrate force, and even the strongest armour can only do so much if there is so little of it. You know how to take advantage of this effect to produce all sorts of tools.", 25n, 1n, [], 0)
    new perk("Crushing", "You know how to build on overwhelming force, to destroy your foes though simply dealing more damage than they can handle. You know how to make tools of all sorts that enable you to vastly augment the forces you can bring to bear.", 25n, 1n, [], 0)
    new perk("Strike True", "You know how to create weapons intended for close-quarters combat. From daggers to spears, all forms of melee weaponry come easy to you and you can even design tools to best suit any user you care to name.", 100n, 1n, [], 5)
    new perk("Climatology", "You have a deep understanding of the interactions between immense volumes of matter and energy, allowing you to predict the evolution of complex systems on the scale of planets. This is primarily geared towards the prediction and manipulation of weather systems, but can take into account the effects of anything of a scale that wouldn't simply be drowned out.", 200n, 1n, [], 0)
    new perk("Anatomy", "You have a deep understanding of the mechanics of biological bodies, granting you a sense of how all the parts of the body function and interact. You fully understand your own body and can easily extend that to any other similar life-form but it only takes a little research for your to expand that to other bodies.", 200n, 1n, [], 1)
    new perk("Antipathogen", "A collection of drugs that act as broad-spectrum anti-biotic and anti-viral treatments. Perfect for use against all but the strongest drug-resistant strains.", 150n, 1n, [], 2)
    new perk("Battle Glue", "A easy to apply topical disinfectant and pathogen barrier that can seal up any injury preventing infection and accelerating the healing of non-gaping wounds.", 150n, 1n, [], 2)
    new perk("Ideal State Enforcement", "Your soul remembers your ideal form the perfect you. And there are ways to project that image back onto reality. Through your arts you know how to reconstruct parts of the body lost to the physical universe.", 500n, 1n, [1], 3)
    new perk("Enduring", "You know how to design and modify systems in such a way as to protect them from the ravages of time - allowing them to operate as they should for tens of times longer than they otherwise would be capable of.", 0n, 1n, [], 1)
    new perk("Fighting Fit", "While Ki already slows aging and fights back against the injuries time inflicts, there are ways to improve this effect, allowing you to effectively turn back the clock by a little bit.", 150n, 1n, [43], 5)
    new perk("MEMS", "Sometimes it is simpler to take advantage of physical interactions, even with highly advanced computation permitting you various ways of sensing the world. You know how to scale down various devices and integrate them into computational systems.", 200n, 1n, [], 1)
    new perk("Hot", "You know how to transmit the property of alchemical heat to any substance, empowering active alchemical properties such as causticity, heat generation, and its ability to break apart and purify", 150n, 1n, [64], 6)
    new perk("Cold", "You know how to transmit the property of alchemical frigidity to any substance, allowing it to resist and passivate alchemical properties and to bind other distinct substances together", 150n, 1n, [64], 6)
    new perk("Wet", "You know how to transmit the property of alchemical humidity to any substance allowing it to be more indistinct, fluidic, flexible and malleable as well as", 150n, 1n, [64], 6)
    new perk("Dry", "You know how to transmit the property of alchemical aridity to any substance, allowing it to be more discrete (in the physical sense), solid, rigid and stiff", 150n, 1n, [64], 6)
    new perk("Earth", "You have grokked the element of Earth, one of the fundamental aspects of the universe. The element of Earth is not the simple dirt around you, but rather the qualities that are more easily seen in it. The stability, weight and impermeability that it displays so well.", 250n, 1n, [64], 6)
    new perk("Air", "You have grokked the element of Air, one of the fundamental aspects of the universe. The element of Air is not the simple atmosphere, but what differentiates it from what is clearly other. The ability to become a formless ephemeral substance that escaped understanding for so long.", 250n, 1n, [64], 6)
    new perk("Water", "The element of water is not merely the substance that fills the oceans, it is that which takes in all things and is free of such base considerations as simple shape and structure for it is fluid in a way that nothing else is.", 250n, 1n, [64], 6)
    new perk("Fire", "Fire is a strange element but you know it nonetheless. It is the element of effect and change, that ability to alter others, to cause heat and to remove weight from that which it alters.", 250n, 1n, [64], 6)
    new perk("Curses", "The ability to create spells that resist removal, usually by engineering a deliberate weakness that empowers the general strength", 500n, 1n, [83], 7)
    new perk("Visualization", "To believe in something, you do not merely need to be able to want it, but to see it as a truth of the world. That faith and understanding that allows the immaterial to be as real to you as the ground you walk on. Not only does this improve your ability to cast magic, it also improves your general capability to conceptualize phenomena of all kinds.", 200n, 1n, [], 7)
    new perk("Alternate Forms", "A sort of limited shapeshifting, gain the ability to take on an alternate form capable of supporting your soul and consciousness, a robot, animal or even an entirely separate species.", 500n, 0n, [], 10)
    new perk("True Worth", "Sometimes progress isn't about creating something new, but instead about using what you have more effectively. You see further than the surface and are able to see exactly what you can use something for.", 300n, 1n, [], 10)
    new perk("Beyond Speech", "You can pick up on the subtle psionic traces that cling to speech, sign language or other active forms of transmitted communication - as well as amplify your own. This allows you to speak with and be understood by any sapient being.", 250n, 1n, [22], 4)
    new perk("Beyond Script", "You can detect the psionic residue that even seemingly blank people leave as they record information, allowing you to understand the meaning of any information stored in a permanent or semi-permanent form.", 250n, 1n, [22], 4)
    new perk("Hard Robotics", "Ah, that dance of the physical and digital. You have an understanding of the mechanics and logic surrounding servos, pulleys, levers and other devices that allow for the movement of various rigid armatures.", 200n, 1n, [], 0)
    new perk("Soft Robotics", "Ah, that dance of the physical and digital. You have an understanding of the mechanics and logic surrounding bladders, hooks, belts and other devices that allows for the controlled deformation of flexible armatures.", 200n, 1n, [], 0)
    new perk("Bioengineering", "You understand how to translate the intricate dance of genetics into complex biological structures, creating novel tissues, organs and even entirely new creatures. You not only understand how to design such things, but also the conditions and processes that would have to take place in order to bring them into reality.", 200n, 1n, [], 0)
    new perk("Sacrifice", "To open one's mind, one must eschew prior preconceptions. One of the best ways to do so is to overcome the taboos that have ruled your life thus far. By breaking various taboos in a ritualistic manner, you can more effectively make use of knowledge beyond the norm", 150n, 1n, [], 8)
    new perk("Branch Prediction", "You understand the delicate nature of temporal branching, and how timelines shift and split. Thus, should you end up in the past, you know how to travel along the timelines you are interested in to get back to the correct one, and how to safely make limited changes.", 25n, 1n, [], 9)
    new perk("Inverse Kzinti Lesson", "Conservation of Momentum, it's the very fundamentals of physics, perhaps one of the first lessons anyone learns. You have a powerful sense of reaction forces and the ability to turn any mass launcher into an effective thruster.", 25n, 1n, [], 1)
    new perk("Eldritch Aspect", "Your soul resonates with some aspect of the universe, something utterly fundamental to the way that the universe works. No trite element or other descriptive aspect, but those things that cannot be extracted or contained.", 1000n, 1n, [104], 8)
    new perk("Portal Barrier", "If you don't want to get hit by something, why get hit at all. Through careful manipulation of the fabric of space-time you can create barriers that will redirect even energy weapons in whatever direction you choose - perhaps back in the direction they came from.", 350n, 1n, [], 9)
    new perk("Wisdom of the Ages", "With a name and enough identifying information to uniquely describe them, you can use the atemporal nature of the soul to call upon the shade of anyone who has died. This state does not harm them nor is it inherently uncomfortable, and indeed, the two of you cannot interact in any way bar harmless communication. Convincing them to part with their secrets is up to you to do", 250n, 1n, [], 3)
    new perk("Guy In The Chair", "You don't need to be on the scene to help. So long as you have a real-time ability to influence the situation, you can bring your full might towards helping out", 500n, 1n, [], 10)
    new perk("Neat Trick", "You can add aesthetic and otherwise non-functional flourishes to your work without needing to spend any more time than if you focused your efforts on a purely functional barebones piece", 0n, 1n, [], 10)
    new perk("Shapeshifting", "You now have a supernatural ability to manipulate your body, which grows stronger each time you roll this perk. At first you might only manipulate your tissues, reshaping them into altered forms. Then you power extends to genetic expression allowing you to change what properties your tissues express. Your penultimate upgrade is your ability to manipulate your very DNA, altering the foundations of your physical form.Finally, your power extends even to the materials around you, enabling you to integrate even inorganic materials into your body, reshaping them as you see fit", 300n, 4n, [], 10)
    new perk("Infomorph", "Your mind and soul now have a stronger connection. This ensures that any upload of your mind is indeed you for all intents and purposes - magical or otherwise. Your mind can also heal from imperfect transfers given time, drawing upon the information stored in your soul", 0n, 1n, [], 10)
    new perk("There's something there", "You have a sense for the unlikely, the potential timelines where the uncommon occur. You are able to influence your vicinity such that uncommon outcomes are more likley to happen to you", 450n, 1n, [], 9)
    new perk("True Genius", "You have a natural aptitude for seeing connections and patterns, beyond the norms of your kind. What's more, your observations tend to be accurate more often than not - allowing you to come to conclusions others might miss", 200n, 1n, [], 0)
    new perk("Calcination", "You understand how to alchemically seperate solids into their component calxes, displaying unique qualities of the source materials. Each material can be split into dry True Calxes and wet Salts", 75n, 1n, [], 6)
    new perk("Distillation", "You know how to alchemically distill liquids seperating them into purer forms with Hot and Cold propeties", 75n, 1n, [], 6)
    new perk("Sublimation", "You know how to extract the airy spirits from solids through the alchemical process of Sublimation, capturing materials that are paradoxically hot and dry without manifesting the properties of flame", 75n, 1n, [], 6)
    new perk("Descension", "You know how to extract the earthly elements from liquid reagents, precipitating the dry and cold properties of a fluid into a pure state", 75n, 1n, [], 6)
    new perk("Solution", "You have learned to imbue the properties of non-fluid materials into fluids, allowing you to create liquids with the properties of a variety of different substances", 75n, 1n, [], 6)
    new perk("Coagulation", "You know how to combine the earthly properties of different liquids to extract a solid substance, seperating them into component parts", 75n, 1n, [], 6)
    new perk("Fixation", "You know how to force solids to take on the properties of liquids and gasses, imbuing them with additional useful traits", 75n, 1n, [], 6)
    new perk("Ceration", "You know how to soften materials through various alchemical processes, granting them properties not unlike metal or wax, introducing Wet properties unto the substance", 75n, 1n, [], 6)
    new perk("Blood Pills", "You know how to create pills from your own blood and Ki that can store vast amounts of your vital energy. Each pill contains close to a 120% of your Ki reserves at the time of creating the pill and combined with the medicinal components of the pills, they can even provide a mild regenerative effect allowing you go from exhausted to fighting fit in moments, as though you had a good meal and a full night's rest", 150n, 1n, [42], 2)
    new perk("Pressure Points", "You gain the ability to identify precise locations on the body of your own species as well as any body that you have had the opportunity to carefully examine, growing stronger with each time you toll this perk. First you learn how to manipulate muscles, forcing them to activate, relax or even enter a chaotic series of spasms. Next you learn how to manipulate the senses, dulling or even amplifying them temporarily. Finally, you learn how to manipulate even involuntary processes. This can be used medicinally or simply to strike someone down with a precise poke", 150n, 1n, [], 5)
    new perk("C-C-C-Counter!", "You know how to hone your reflexes and train your skills into your subconcious mind, taking advantage of your ki-augmented senses. This cuts your reaction time to practivally nothing, allowing you to react to practically any suprise attack", 0n, 1n, [], 5)
    new perk("Uncertainty", "There is an underlying structure to the seeming chaos at the bottom of reality, and with the right knowledge it becomes possible to manipulate such a thing. You now understand the nature of uncertainty that dwells in the smallest corners of physics allowing you such feats as teleportation and pair production", 300n, 1n, [], 1)
    new perk("Heat", "What by many is thought to be a wild and chaotic result of entropy has rules of its own. And while they may be complex, they can be manipulated. You now have deep and detailled understanding of how heat propogates and is effects substances", 200n, 1n, [], 1)
    new perk("Evolution", "You understand how all sorts of systems respond to stimuli, especially those systems that can adapt. This goes beyond mere biological evolution, you are able to work out how any sufficiently complex conglmeration will change over time", 250n, 1n, [], 1)
    new perk("Structural Psychology", "You have a deep understanding of how physical structures translate to operational function, something that applies especially well to logical systems. Though it might take you some time and experiments, you can even extrapolate the generalities of the thought processes and instincts of a lifeform with enough information about their nervous system or whatever analogue they may have, as well as the effect that stimulus and even alteration to those cognitive structures would have", 200n, 1n, [], 1)
    new perk("Experimental Psychology", "You have a good sense on the externalised aspects of the mind, and with some study and experimentation, can fairly reliably predict the actions a conciousness will take in response to specific stimuli", 200n, 1n, [], 1)
    new perk("Ergonomics", "You have a solid understanding of how people interact with the world around them, and as a result are able to create things that are natural, comfortable and intuitive to use. You can pick apart any body plan and design tools, equipment and other devices in such a way that they are a joy to work with... or a nightmare", 200n, 1n, [], 1)
    new perk("Cognitive Analysis", "You are well versed in the workings of a mind, how to render even the seemingly chaotic realms of emotion into fairly clear workings. Through studies of people's actions you can extrapolate an accurate model their individual minds, or a more general set of trends", 200n, 1n, [], 1)
    new perk("Armchair General", "You might not have put boots on the ground, but at the end of the day, it is logistics that win wars. You have the knowledge of someone who has studied hundreds, if not thousands of wars, and can plot out supply lines and deployments with ease. Not only can you utilise your own resources well, you can also analyse the movements of your foes to determine their strategies and plots", 200n, 1n, [], 1)
    new perk("Educational", "You understand the workings of a mind well enough to understand how to best impart information unto it with whatever tools you so choose. While this mainly covers your own species, you have enough broadly applicable insight to adapt to others with a little practice", 200n, 1n, [], 1)
    new perk("Habitual", "you gain the ability to instil habits into your mind and those of others, though that is much easier with their co-operation. This allows you to instil certain behaviours that they will feel natural doing and even find skipping somewhat annoying", 350n, 1n, [], 4)
    new perk("Spoon Bending", "Something of a parlour trick, but no less a useful telekinetic skill. You know how to project a small but still reasonable amount of force onto any point within ten centimeters of you. This isn't precise or well controlled at first, but is a fairly useful training exercise for those skills anyways", 0n, 1n, [22], 4)
    new perk("Libromancy", "You have gained an understanding of a set of skills focused on the manipulaiton of recorded information. Beginners know how to scry for specific information in large volumes of text, easily record and absorb such information as well as perform complex rituals to uncover the meaning of words in languages they do not speak. Adepts become capable of generating accounts of events, individuals and items that they have heard of uncovering facts that may have even been considered lost to time", 300n, 3n, [83], 7)
    new perk("Haunting Whispers", "You can open your ears to the whispers of what lays beyond. Though be warned, even if it may not be useful to you, what you learn here is not for the faint of heart. Even if you mind might be able to handle it, your body may not, and spilling these secrets to others can have mixed results", 0n, 1n, [104], 8)
    new perk("Persistent Whispers", "You know how to phrase and reveal things in such a way that they remain in the minds of those who hear them", 0n, 1n, [], 8)
    new perk("Eternal", "Your understanding of the underlying processes of the world allows you to create objects and structures that seem to be immune to deterioration - be it due to age, weather or otherwise", 0n, 1n, [104], 8)
    new perk("Conjurer's Container", "You know an enchantment that can be applied to containers of all kinds, anchoring a pocket of space to them that massively multiplies the internal volume and hides the mass of all stored things from the outside world", 150n, 1n, [83], 2)
    new perk("Planar Support Systems", "The boundary of each plane is the first line of defence when it comes to any sort of extraplanar incursion. You know how to build complex and power hungry systems that will reinforce the barrier locally, with your systems able to project out to about five billion kilometres given sufficient power and enough installations to spread out the strain", 250n, 1n, [], 9)
    new perk("Corners of Existence", "You have a deep understanding of spatial topology, enough to see where the conditions are just right that the dimensions are a little softer than they should be. It's more common than you would think! Regardless, you know how to make use of these spaces as stashes that fit more than you would think or even hiding places that most usually would not notice", 0n, 1n, [], 9)
    new perk("Refined", "You know how to create things with a sense of timeless presence, with a certain immortality to their allure. You can even do so without in any way impacting the other functions of your creations.", 200n, 1n, [], 0)
    new perk("Intricate", "You know how to make every little detail of your creations catch the eye, with not only intricate decorations but alluring glimpses of what lies beneath. Despite that, your creations are no less durable or functional than they otherwise would be.", 200n, 1n, [], 0)
    new perk("Bare", "Covers? Panelling? Why would anyone want to hide the mechanical beauty of your work? You know how to create your systems in such a way that they need no protection and can operate without any covering and even gaps in what would be protective armour that will nonetheless have no impact on your durability.", 200n, 1n, [], 0)
    new perk("Cryptography", "You know how to use mathematical operations to transform data for a varitey of purposes, be it simple ciphers or algorithms that can stand up to teams armed with quantum computers.", 300n, 1n, [], 0)
    new perk("Void Warfare", "The distances you need to deal with in the void are immense, so much so that even light slows to a crawl. Combined with the inherent three-dimensionality of a microgravity battlefield, it takes a great deal of skill to thrive here - skill that you now have.", 200n, 1n, [], 0)
    new perk("Beyond Zero", "There lies something beneath. Something less than nothing. You have understood enough to create the inverted reflection of existence itself and create negative energy constructs.", 400n, 1n, [], 1)
    new perk("Olympic Travel Torches", "You you now have the designs for a series of incredibly powerful and efficient fusion motors capable of fusing even dirty protium. You have designs for everything from tiny finger-sized micro-thrusters to immense hyper-efficient engines capable of accelerating city-sized colony ships.", 150n, 1n, [], 2)
    new perk("Turret Tower", "ou have designs for a system of articulation, sensors and aiming software that can be quickly adapted to practically any weapons system you care to name, allowing you to turn it into an autonomous turret.", 50n, 1n, [], 2)
    new perk("Ward Pylon", "ou have designs for a potent magical artefact that can be used to anchor and power static magical effects, especially those of a persistent and defensive nature making them especially useful for wards.", 100n, 1n, [83], 2)
    new perk("Astral Projection", "It is wrong to say that a spirit can drift far away from the body that sustains it. Such material concerns are no issue for a Soul. Still, you know how to use spiritual senses to perceive distant locations and even more abstract information.", 150n, 1n, [0], 3)
    new perk("Everything You Touch", "Everything a soul interacts with remembers that association, carrying traces of the soul and what was done ad infinitum. You know how to use your own soul to pick up on these traces", 150n, 1n, [0], 3)
    new perk("Shikigami", "You know how to bind souls and spirits to your sevice, creating forms that can even influence the physical world. These are even capable of communicating with you, able to share what they have experienced.", 150n, 1n, [0], 3)
    new perk("Always Armed", "You know how to use anything as a weapon. With a few moments of thought, you can figure out basic strategies to use anything effectively and with time refine it into a true fighting style that takes advantage of the key traits of anything in combat.", 100n, 1n, [], 5)
    new perk("Battle Intent", "You know how to sense the subtle fluctuations in Ki that allow you to get a sense of your opponent's next actions, akin to reading muscles and posture.", 50n, 1n, [42], 5)
    new perk("Body Reading", "You understand how shifts in posture and muscle tension can predict the future actions of your opponents, allowing you to prepare your own response.", 50n, 1n, [], 5)
    new perk("Humours", "You know how to manipulate alchemical imbalances in the body to cause and address damage and illness within living bodies through the application of alchemical processes.", 100n, 1n, [], 6)
    new perk("Analysis", "You know how to analyse the structure of an object through alchemical means, uncovering not only the internal configuration of matter, but also the composition thereof without leaving any physical traces", 150n, 1n, [], 6)
    new perk("Hidden Meaning", "You know how to encode information into messages and images in such a way as only certain people can perceive them. This might be a particular person you choose or people with certain opinions and other mental characteristics", 50n, 1n, [22], 4)
    new perk("Mind Sense", "You know how to pick up on psionic energy using your own mental prowess. This allows you to sense not only minds but even the psionic energy bound in constructs or psionic technology", 150n, 1n, [22], 4)
    new perk("Weight of Meaning", "You can detect the traces of psionic energy left behind by people as they focus on something, revealing hidden objects and with some practice even subtle things like the keys used to input a passcode", 100n, 1n, [22], 4)
    new perk("Enforcers", "You know how to summon beings that seem to embody the laws of reality, ensuring what should be. These beings are especially potent against beings that go against the natural order of things such as time travellers, precognitives, beings with different dimensional properties and are able to counter their abilities. The second time you roll this perk, you gain the ability to avoid having the creatures you summon target you. The final time allows you to set a specific target for the creatures to prioritise", 200n, 3n, [104], 8)
    new perk("What Is", "ou know how to rewind the progression of an object or place in time, temporarily reverting it into a previous state, and even conjuring phantoms of things that were present but no longer are", 400n, 1n, [104], 8)
    new perk("What Could Be", "You know how to transform an object into a state it could take, with a sense of what that might be. You can choose to manifest more common futures or perhaps more unlikely events", 500n, 1n, [104], 8)
    new perk("Space Warp", "You are able to understand the way complex spatial geometries effect and are effected by the world around them. Everything from the complex geometry of wormholes to the simple gravitational wells caused by all matter comes easily to you", 150n, 1n, [], 9)
    new perk("Higher Perspective", "You know how to lense sensors other detectors through higher dimensional spaces, allowing you to bypass barriers limited to merely three dimensions", 450n, 1n, [], 9)
    new perk("A Bigger Picture", "You know how to map the surrounding extradimensional space, allowing you to pick up the presence of other planes and whatever else exists in your extraplanar neighbourhood", 250n, 1n, [], 9)
    new perk("Ruin Radar", "You know the unexpected and unintended ways people will abuse a technology should you make it widely acessible, as well as the effects this will have on civilization at large", 0n, 1n, [], 10)
    new perk("Arcane Automation", "There is a certain trick to the mass manufacture of magical artefacts and it now lies within your grasp. You know how to create grand magical foundries capable of turning out identical enchanted items en mass", 150n, 1n, [83], 7)
    new perk("Arcane Analysis", "You understand how to pick apart magical constructs diving meaning from their makeup and coming to understand how they work", 250n, 1n, [83], 7)
    new perk("Mysterious Presence", "You know how to detect the presence of magic in your vicinity, even in a passive state. Not only can you do this deliberately to detect subtle or even otherwise hidden magic, you are practiced enough that you passively analyse your surroundings, and know how to train this further until you can pick apart spells as they are being used against you", 25n, 1n, [83], 7)
    new perk("Restoration magic", "You know how to use magic to undo the damage done to objects, returning them back to a pristine state.Roll this again and you know how to turn this into an enchantment that will cause items to repair themselves over time. The final time you receive this perk allows you to extend this effect to even animate things.", 300n, 3n, [83], 7)
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
    return valid_perks[seeded_generator.rand_range(valid_perks.length)].roll();
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
    validate_groups()
}

window.addEventListener("load", setup_march)