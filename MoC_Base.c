#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <inttypes.h>
#include <emscripten.h>

typedef struct PRIZE
{
    uint16_t id;
    uint16_t cost;
    uint16_t name_len;
    uint16_t desc_len;
    uint8_t times_received;
    uint8_t repeatable;
    char *name;
    char *desc;
    struct PRIZE *dependency;
    bool extended;
} PRIZE;

typedef struct PRIZE_RESOLVER
{
    char *message;
    uint64_t len;
    bool dependency_success;
} PRIZE_RESOLVER;

uint32_t points;

static const uint16_t core_prizes = 351;
static const uint16_t ext_prizes = 0;

uint16_t max_prizes = 0;
uint16_t num_prizes = 0;
uint16_t num_extend = 0;
PRIZE ***core_start = NULL;
PRIZE ***ext_start = NULL;

PRIZE default_prize = {
    .id = UINT16_MAX,
    .cost = 0,
    .name_len = 8,
    .desc_len = 8,
    .times_received = 0,
    .repeatable = 0,
    .name = "default",
    .desc = "default",
    .dependency = NULL,
    .extended = false};

PRIZE_RESOLVER *response_handle = NULL;

static const uint64_t mt_const = 6364136223846793005;
uint64_t mt_current = 0;
uint64_t mt_position = 0;

PRIZE *Table_Resolver(uint16_t index)
{
    if (index < core_prizes)
    {
        uint16_t i_0 = index / 256;
        uint16_t i_1 = index - (i_0 * 256);
        return core_start[i_0][i_1];
    }

    index = index - core_prizes;
    if (index < ext_prizes)
    {
        uint16_t i_0 = index / 256;
        uint16_t i_1 = index - (i_0 * 256);
        return ext_start[i_0][i_1];
    }
    printf("Prize ID invalid\n");
    return &default_prize;
}

uint64_t Advance_Mersenne_Sequence()
{
    // printf("step\n");
    mt_position++;
    uint64_t mt_next = (mt_const * (mt_current ^ (mt_current >> 62)) + mt_position);
    mt_current = mt_next;
    return mt_next;
}

void Add_Prize(uint16_t cost, const char *name, const char *desc, uint8_t repeatable, PRIZE *dependencies)
{
    if (num_prizes > core_prizes)
    {
        printf("ERROR: Total Core Prizes Exeeded, update number of core prizes\n");
        return;
    }
    PRIZE *rval = (PRIZE *)malloc(sizeof(PRIZE));
    (*rval).id = num_prizes;
    (*rval).cost = cost;
    (*rval).name_len = strlen(name);
    (*rval).name = (char *)calloc(sizeof(char), (*rval).name_len + 1);
    strcpy((*rval).name, (void *)name);
    (*rval).desc_len = strlen(desc);
    (*rval).desc = (char *)calloc(sizeof(char), (*rval).desc_len + 1);
    strcpy((*rval).desc, (void *)desc);
    (*rval).times_received = 0;
    (*rval).repeatable = repeatable;
    (*rval).dependency = dependencies;
    (*rval).extended = false;
    uint16_t i_0 = num_prizes / 256;
    uint16_t i_1 = num_prizes - (i_0 * 256);
    core_start[i_0][i_1] = rval;
    num_prizes++;
}

EMSCRIPTEN_KEEPALIVE uint64_t Get_Seed_Steps(){
    return mt_position;
}

void Add_Prize_Extended(uint16_t cost, const char *name, const char *desc, uint8_t repeatable, PRIZE *dependencies)
{
    if (num_extend > ext_prizes)
    {
        printf("ERROR: Total Extended Prizes Exeeded, update number of extended prizes\n");
        return;
    }
    PRIZE *rval = (PRIZE *)malloc(sizeof(PRIZE));
    (*rval).id = num_extend + core_prizes;
    (*rval).cost = cost;
    (*rval).name_len = strlen(name);
    (*rval).name = (char *)calloc(sizeof(char), (*rval).name_len + 1);
    strcpy((*rval).name, (void *)name);
    (*rval).desc_len = strlen(desc);
    (*rval).desc = (char *)calloc(sizeof(char), (*rval).desc_len + 1);
    strcpy((*rval).desc, (void *)desc);
    (*rval).times_received = 0;
    (*rval).repeatable = repeatable;
    (*rval).dependency = dependencies;
    (*rval).extended = true;
    uint16_t i_0 = num_extend / 256;
    uint16_t i_1 = num_extend - (i_0 * 256);
    ext_start[i_0][i_1] = rval;
    num_extend++;
}

EMSCRIPTEN_KEEPALIVE void Reset_Recieve_Amounts()
{
    points = 0;
    for (uint16_t i = 0; i < max_prizes; i++)
    {
        // printf("%"PRIu32"\n", i);
        Table_Resolver(i)->times_received = 0;
    }
}

EMSCRIPTEN_KEEPALIVE void Set_Rand_Seed(uint64_t seed, uint64_t steps, uint32_t set_points)
{
    mt_current = seed;
    mt_position = 0;
    points = set_points;

    // printf("%"PRIu64"\n", seed);

    while (mt_position < steps)
    {
        Advance_Mersenne_Sequence();
    }
}

uint64_t BigInt_64_String_Length(uint64_t val)
{
    uint64_t costlen = 1;
    while (val > 9)
    {
        costlen++;
        val = val / 10;
    }
    return costlen;
}

uint64_t BigInt_16_String_Length(uint16_t val)
{
    uint64_t costlen = 1;
    while (val > 9)
    {
        costlen++;
        val = val / 10;
    }
    return costlen;
}

uint64_t BigInt_8_String_Length(uint8_t val)
{
    uint64_t costlen = 1;
    while (val > 9)
    {
        costlen++;
        val = val / 10;
    }
    return costlen;
}

const char *prize_string = "%s{\n\"id\":%" PRId16 ",\n\"name\":\"%s\",\n\"cost\":%" PRIu16 ",\n\"description\":\"%s\",\n\"times_recieved\":%" PRIu8 ",\n\"success\":%"PRIu8",\n\"extended\":%d\n},\n";

PRIZE_RESOLVER *Resolve_Dependency(PRIZE *prize)
{
    uint64_t len = 0;
    char *prev_msg = NULL;

    PRIZE_RESOLVER *result = (PRIZE_RESOLVER *)malloc(sizeof(PRIZE_RESOLVER));
    result->dependency_success = true;
    if (prize->dependency != NULL)
    {
        PRIZE_RESOLVER *dep = NULL;
        dep = Resolve_Dependency(prize->dependency);
        len += dep->len - 1;
        prev_msg = dep->message;

        if (!dep->dependency_success)
        {
            result->dependency_success = false;
        }

        free(dep);
        dep = NULL;
    }

    // printf("dep status: %d\n", result->dependency_success);

    uint8_t resolution = 0;

    if ((prize->cost <= points) && result->dependency_success)
    {
        if (prize->times_received < prize->repeatable)
        {
            printf("Here\n");
            result->len = len + 110 + BigInt_16_String_Length(prize->id) + prize->name_len + BigInt_64_String_Length(prize->cost) + prize->desc_len + BigInt_8_String_Length(prize->times_received);
            prize->times_received = prize->times_received + 1;
            if (strlen(prize->desc) != prize->desc_len)
            {
                printf("%s\n", prize->desc);
            }
            result->message = (char *)calloc(1, result->len);
            if (prev_msg == NULL)
            {
                sprintf(result->message, prize_string, "", prize->id, prize->name, prize->cost, prize->desc, prize->times_received, resolution, prize->extended);
            }
            else
            {
                sprintf(result->message, prize_string, prev_msg, prize->id, prize->name, prize->cost, prize->desc, prize->times_received, resolution, prize->extended);
            }
            points = points - (uint32_t)prize->cost;

            free(prev_msg);

            return result;
        }
        resolution = 2;
    }else{
        result->dependency_success = false;
        if(result->dependency_success){
            resolution = 3;
        }else{
            resolution = 1;
        }
        
    }

    result->len = len + 110 + BigInt_16_String_Length(prize->id) + prize->name_len + BigInt_64_String_Length(prize->cost) + prize->desc_len + BigInt_8_String_Length(prize->times_received);
    if (strlen(prize->desc) != prize->desc_len)
    {
        printf("%s\n", prize->desc);
    }
    result->message = (char *)calloc(1, result->len);
    if (prev_msg == NULL)
    {
        sprintf(result->message, prize_string, "", prize->id, prize->name, prize->cost, prize->desc, prize->times_received, resolution, prize->extended);
    }
    else
    {
        sprintf(result->message, prize_string, prev_msg, prize->id, prize->name, prize->cost, prize->desc, prize->times_received, resolution, prize->extended);
    }

    // printf("%s\n", result->message);

    free(prev_msg);
    return result;
}

EMSCRIPTEN_KEEPALIVE uint64_t Roll_Random_PRIZE()
{
    points += 100;
    if (response_handle->message != NULL)
    {
        free(response_handle->message);
        response_handle->message = NULL;
    }
    PRIZE* start = Table_Resolver(Advance_Mersenne_Sequence() % max_prizes);
    while (start->times_received >= start->repeatable)
    {
        start = Table_Resolver(Advance_Mersenne_Sequence() % max_prizes);
    }
    // printf("%"PRIu64"\n", index);
    PRIZE_RESOLVER *response = Resolve_Dependency(start);
    uint64_t len = response->len;
    while (response->message[len - 1] == '\0')
    {
        len = len - 1;
    }
    response_handle->len = len;
    response_handle->message = response->message;
    free(response);
    return len;
}

EMSCRIPTEN_KEEPALIVE uint64_t Roll_Prize_By_Id(uint16_t id)
{
    PRIZE *start = Table_Resolver(id);
    PRIZE_RESOLVER *response = Resolve_Dependency(start);
    uint64_t len = response->len;
    while (response->message[len - 1] == '\0')
    {
        len = len - 1;
    }
    response_handle->len = len;
    response_handle->message = response->message;
    free(response);
    return len;
}

EMSCRIPTEN_KEEPALIVE void Increment_Prize_By_Id(uint16_t index)
{
    // printf("expect = %u: %d\n", index, Table_Resolver(index)->times_received+1);
    Table_Resolver(index)->times_received = Table_Resolver(index)->times_received + 1;
    // printf("check = %u: %d\n", index, Table_Resolver(index)->times_received);
}

// EMSCRIPTEN_KEEPALIVE void test_print(char *string, uint16_t len)
// {
//     printf("%d\n", len);
//     for (uint16_t i = 0; i < len; i++)
//     {
//         printf("%c", string[i]);
//     }
//     printf("\n");
//     printf("%lu\n", strlen(string));
// }

EMSCRIPTEN_KEEPALIVE uint16_t Get_Prize_Id_By_Name(char *name, uint16_t len)
{
    name[len] = '\0';
    for (uint16_t i = 0; i < max_prizes; i++)
    {
        PRIZE *row = Table_Resolver(i);
        if (strcmp(row->name, name))
        {
            continue;
        }
        return row->id;
    }
    return UINT16_MAX;
}

EMSCRIPTEN_KEEPALIVE void Print_Perk_Details(uint16_t id)
{
    PRIZE *prize = Table_Resolver(id);
    if (prize->dependency != NULL)
    {
        printf("ID: %"PRIu16"\nName: %s\nCost: %" PRId16 "\n\nDescription:\n%s\n\nDependency: %s\n", prize->id, prize->name, prize->cost, prize->desc, prize->dependency->name);
    }
    else
    {
        printf("ID: %"PRIu16"\nName: %s\nCost: %" PRId16 "\n\nDescription:\n%s\n", prize->id, prize->name, prize->cost, prize->desc);
    }
}

void Recursive_Resolver(PRIZE *prize)
{
    if (prize->dependency != NULL)
    {
        Recursive_Resolver(prize->dependency);
    }
    printf("Name: %s\nCost: %" PRId16 "\n\nDescription:\n%s\n", prize->name, prize->cost, prize->desc);
}

EMSCRIPTEN_KEEPALIVE void Resolve_Specific_Perk(uint16_t id)
{
    Recursive_Resolver(Table_Resolver(id));
}

EMSCRIPTEN_KEEPALIVE uint64_t Read_Current_Response_String(char *dest)
{
    memcpy(dest, response_handle->message, sizeof(char) * (response_handle->len));

    return mt_position;
}

EMSCRIPTEN_KEEPALIVE uint32_t Get_Current_Points()
{
    return points;
}

int main(int argc, char const *argv[])
{
    if (core_prizes > 0)
    {
        uint16_t i_0 = (core_prizes / 256) + 1;
        core_start = (PRIZE ***)calloc(i_0, sizeof(PRIZE **));
        for (uint16_t j = 0; j < i_0; j++)
        {
            core_start[j] = (PRIZE **)calloc(256, sizeof(PRIZE **));
        }
    }

    if (ext_prizes > 0)
    {
        uint16_t i_1 = (ext_prizes / 256) + 1;
        ext_start = (PRIZE ***)calloc(i_1, sizeof(PRIZE **));
        for (uint16_t j = 0; j < i_1; j++)
        {
            ext_start[j] = (PRIZE **)calloc(256, sizeof(PRIZE **));
        }
    }

    max_prizes = core_prizes + ext_prizes;

    response_handle = (PRIZE_RESOLVER *)malloc(sizeof(PRIZE_RESOLVER));
    response_handle->len = 0;
    response_handle->message = NULL;
    points = 0;

    Add_Prize(0, "Spiritual Energy", "The stuff that makes up souls. That undefinable thing that still defines everything. Everything makes it all the time, and you now make more than you used to. While this is enough to manipulate it to your own ends, the excess is not an incredible amount", 255, NULL);
    Add_Prize(300, "The Root of Meaning", "There is meaning to this world. Yet, if you ground all of existence into its finest components and searched through it all, you would find none. It is this paradox that you now command, to be able to empower the very meaning that is born of form and function", 1, Table_Resolver(0));
    Add_Prize(300, "Divine Insight", "Gods Exist. Or do they? Born of belief yet having always existed, it is difficult to say if people created gods or gods created people. The answer to that dichotomy is the core to divinity - the end result of Meaning enforced upon existence through collective action. And that is a secret you now hold in your heart of hearts", 1, Table_Resolver(0));
    Add_Prize(300, "Sword Intent", "Or anything intent, really, you know how to imbue spiritual energy into items you craft giving them the beginnings of sentience. Though they will never develop any true sapience, they are born with 'instincts' regarding their proper use and will learn alongside their wielders. They can make their desires known to their operators and function better than they physically should, growing as their souls do.", 1, Table_Resolver(0));
    Add_Prize(600, "Spirits", "Not quite souls, but perhaps something along the way. Spiritual constructs with a degree of agency capable of carrying out specific tasks and acting in a specific manner are far simpler to make and can ", 1, Table_Resolver(0));
    Add_Prize(900, "Souls", "Souls are a complex thing. Yet, ultimately, quite simple to make. Even the complex souls of people are often created though complete accident. Indeed, a simple object well cared for will eventually gain an identity strong enough to form a soul. You now understand this principle that with sufficient study you can create souls of varying complexity from simple rocks to the intricate existences of people and possibly beyond.", 1, Table_Resolver(0));
    Add_Prize(600, "Elementals", "Elementals are interesting things. In many ways, they are concepts, enforced onto the world souls that have no need for a form to interact with the world. Though, perhaps because of this, they tend to be... otherwise simple. Still, you understand how to reinforce spiritual structures so that they may influence the wider world without a supporting anchor.", 1, Table_Resolver(0));
    Add_Prize(300, "Ichor", "Said to be the blood of gods, this material is effectively condensed spiritual energy, rendered into a mores stable form. This has a number of uses, though that might require some experimentation for you to uncover", 1, Table_Resolver(0));
    Add_Prize(300, "Altar", "These devices gather devotion, the deliberate act of sacrifice in order to venerate another, be that of time or something more material. When these acts are performed at an altar, it empowers the souls of the item in question.", 1, Table_Resolver(2));
    Add_Prize(300, "Icon", "These devices gather faith, the deep-seated belief in the capabilities of something. This empowers that soul to act within the vicinity of the icon, dependent on the belief of the wielder.", 1, Table_Resolver(2));
    Add_Prize(300, "Offering", "By preparing an object and ritually destroying it, you can grant strength to the items that you wish to empower. This imbues them with additional spiritual strength, which can be improved by preparing specific offering in line with the soul in question. This also improves the quality of the object to a supernatural degree.", 1, Table_Resolver(2));
    Add_Prize(600, "Pact", "A sufficiently powerful soul may grant a portion of its power to another, bestowing them with a measure of their strength. In doing so however, the recipient is bound to the terms of the transfer.", 1, Table_Resolver(0));
    Add_Prize(300, "Demesne", "A space claimed by a sufficiently powerful soul can, with time, be suffused with their strength, empowering allies and weakening foes. The strength of this depends of the age of the claim and the power of the soul in question", 1, Table_Resolver(0));
    Add_Prize(750, "Cairn", "Souls normally travel through the natural paths to afterlives and through reincarnation upon the deaths of their mortal forms. However, you know how to create a new path, creating a shelter for souls that meet various criteria", 1, Table_Resolver(0));
    Add_Prize(400, "Meridians", "These channels of Spiritual Energy enable a soul to more easily effect the physical world. These run through the physical counterpart of the soul, not only allowing the soul to manifest exotic effects, but also granting a measure of the strength and durability of the soul onto the body", 1, Table_Resolver(0));
    Add_Prize(300, "Aura", "The properties of a soul made evident. Through various means, you may extend the spiritual presence of a soul such that other souls become aware of it. This may simply be limited to a 'vibe' for weaker souls, but more powerful ones will radiate their particular nature in a manner that is obvious to any witnesses", 1, Table_Resolver(0));
    Add_Prize(500, "Realm", "A space claimed by a soul can begin to show the properties of the soul in question, should it be sufficiently powerful and have enough time to work. Though this may simply begin as a place's ownership being evident, the ream will take on traits that reflect the owner's soul", 1, Table_Resolver(0));
    Add_Prize(600, "Totemic Spirit", "More a spirit of an idea than anything else, these constructs are effectively the souls of things like families, organizations or even causes. In addition to being able to eventually empower those aligned with it, the spirit can also act as a focus for empowerments to be spread across a broader concept", 1, Table_Resolver(0));
    Add_Prize(400, "Koshchei's Box", "Physical distance means very little to a soul, at the end of the day, and sometimes it's best to keep a soul safe… elsewhere. You know how to create a container for a soul, allowing it to remain safe elsewhere while still retaining normal faction of its physical body.", 1, Table_Resolver(1));
    Add_Prize(300, "Divine Regalia", "You know how to create tools that amplify aspects of a divine existence, allowing them to be more easily expressed unto the physical universe. As a side effect, even your mundane creations are of such quality that the gods themselves would fight over them.", 1, Table_Resolver(2));
    Add_Prize(150, "Ghost Traps", "You can create devices that can contain spiritual presences. These traps activate under specific conditions and drag any spiritual presences not bound within a physical anchor into a holding chamber from which they can later be released", 1, Table_Resolver(0));
    Add_Prize(500, "Unhallowed Ground", "You can prepare a space such that it is inimitable to spiritual presences, and are capable of optimising the effect for specific groups or individual examples for greater effect given sufficient knowledge of them. At a base level, this offers resistance to their influence but can scale to utterly barring them from being able to access the space.", 1, Table_Resolver(0));
    Add_Prize(0, "Psionics", "The true power of Mind over Matter. Though it is not limited to the realm of the material psionic energy is a manifestation of your inner self on the outside world. This grants additional psionic abilities, enough to raise the average mind to that of a neophyte psychic", 255, NULL);
    Add_Prize(300, "WE/YOU/I ARE ONE", "Your mind is a part of a greater whole thoughts and beliefs flow in and out. The boundary of your existence if far more permeable than you would have thought and you know how to have your mind reach out, feel and manipulate", 1, Table_Resolver(22));
    Add_Prize(300, "Where Do I End", "You are a part of the universe. A part that thinks. But where do you end? You have a command over your existence that most of it does not have, and with the right Will, you may enforce that command over more than thoughts", 1, Table_Resolver(22));
    Add_Prize(500, "Technokinesis", "What is technology, but the dreams of people made manifest. Technology has a particular relationship with psionic energies, and you now have the aptitude necessary to directly interface with technology of all kinds with your psychic prowess.", 1, Table_Resolver(22));
    Add_Prize(300, "Thermokinesis", "Though some might think of this as pyrokinesis, in truth, this is a broader discipline. Temperature is a fundamental part of reality, and one that you can now exercise some serious control over.", 1, Table_Resolver(22));
    Add_Prize(300, "Photokinesis", "Though it may seem as though telekinesis creates energy, that is largely a side effect of the resultant movement. Truly creating energy from psionic power is actually fairly tricky. Still, you now have the aptitude and basic skills necessary to generate bursts of light and even manipulate existing photons through psionic might.", 1, Table_Resolver(22));
    Add_Prize(300, "Electrokinesis", "Manipulating something as small and uncertain as electrons requires a delicate touch and a certain mentality that you now possess. Not only are you able to make electrons dance, but you can also generate magnetic fields through will alone.", 1, Table_Resolver(22));
    Add_Prize(300, "Psionic Integration", "Psychoactive materials are quite difficult to make, but an integral part of any psionic technology that doesn't involve an ability for self-determination. You gain the fundamental knowledge necessary needed to build psionic devices, including the relevant structural and chemical theory", 1, Table_Resolver(22));
    Add_Prize(300, "Telepathic Interface", "Controlling devices with your mind is an interesting prospect, though one that generally requires another mind to link with. With careful application however, you can create a system that operates almost as an extension of the user, receiving and sending telepathic signals that can allow for the use of complex systems", 1, Table_Resolver(29));
    Add_Prize(300, "Telekinetic Arrays", "Ah, motive force. The fundamental interface between the now and will be. Producing this through artificial means is the core of creating psionic technology with an ability to impact the physical world.", 1, Table_Resolver(29));
    Add_Prize(300, "Illusionary Systems", "Illusions are an interesting aspect of the psionic arts. Though some believe it could be considered an aspect of telepathy, the truth is that illusions are far more complex constructs, capable of programmed action independent of direct control. These psionic constructs can effectively be used as incredibly versatile components that can be altered as necessary", 1, Table_Resolver(29));
    Add_Prize(500, "Mimetic Technology", "Ideas are the genetics of civilisation, from opinions to traditions, being able to create mental constructs that spread and persist is both easy and incredibly difficult. Simple earworms are but party tricks compared to what you are capable of.", 1, Table_Resolver(22));
    Add_Prize(300, "Empathic Sensors", "Reaching into the subconscious is quite tricky, but necessary for a wide variety of purposes. Through various complex psionic processes, you can create sensors that pick-up emotion, desires, intent and all the other underlying currents of the mind", 1, Table_Resolver(29));
    Add_Prize(200, "Mind Crystals", "While there are mundane materials that can interact with psionic energies, few things can compare to materialised psionic energy. Both in terms of its ability to interact with external psionic energy and fuel psionic creations through the controlled release of the stabilised power.", 1, Table_Resolver(22));
    Add_Prize(200, "Thoughtforms", "Complex psionic constructs are interesting, in that they produce a sort of intelligence independent of any actual mind. Though this is often limited to a programmatic response to psionic stimuli, these creations are quite interesting", 1, Table_Resolver(22));
    Add_Prize(200, "Mindscapes", "A mindscape is interesting, even the mundane exercises can yield useful results. However, a psionic adept can use this to extremely interesting effect allowing for better control over memory and various aspects of the mind", 1, Table_Resolver(22));
    Add_Prize(200, "Mental Defences", "The existence of psionics is somewhat unsettling to some, and even psychics are only able to fight off attacks that they are aware of. As such, there comes a need to be able to create autonomous constructs that can protect the mind from unwanted intrusion", 1, Table_Resolver(22));
    Add_Prize(300, "True Speech", "Communication in and of itself is an interesting phenomenon, a mind influencing others through the sharing of information. This has implications to a psionic individual, and with the right skills it becomes possible to understand and make yourself understood by dealing with the informational content of any message", 1, Table_Resolver(22));
    Add_Prize(200, "A Memory", "What it seems like. A memory, one extracted from your mind or one being focused on by another. It takes the form of liquid lightning and can be passed on to others.", 1, Table_Resolver(22));
    Add_Prize(200, "Mental Helm", "This physical object, when placed in proximity to the seat of consciousness imbues it's wearer with powerful psionic protections, allowing them to shrug off almost any mental intrusion. ", 1, Table_Resolver(29));
    Add_Prize(0, "Ki", "A mystical energy associated with feats of physical and athletic prowess. This energy grows in response to physical exertion and tends produce results for physical training beyond what would be considered natural. This grants you capabilities equal to an average adept, nothing particularly special, but nothing to be concerned about either", 255, NULL);
    Add_Prize(300, "Put Your Back Into It", "Ki is substance, it is existence. You know how to call upon this energy and put your whole self into everything you do. In addition to magnifying the effects of your actions, it allows you a control over the outcome of your actions beyond what is physically possible.", 1, Table_Resolver(42));
    Add_Prize(300, "Martial Reinforcement", "You know how to flow your Ki into objects you wield making them more durable and effective. Your skill in this grows with time and power, but even initially, you can empower swords enough to cut through wooden posts without so much as dulling the blade.", 1, Table_Resolver(42));
    Add_Prize(300, "Legendary Smith", "Your works are just better. Better than they have any right to me. Perhaps it is the ki adding more than strength to your blows, producing works that are orders of magnitude more capable than they really should be.", 1, Table_Resolver(42));
    Add_Prize(300, "Beat it into Them", "Demonstrating, but the real way to learn how to fight is to fight. You can train people incredibly quickly through a combination of demonstration and sparring forcing proper form and technique into the minds of your students", 1, Table_Resolver(42));
    Add_Prize(300, "Attuned Tools", "It normally takes years to get used to a tool, to know it as you know yourself. However, with sufficient skill a craftsman can create a tool designed for a single person, allowing them to wield it with such ease that it is better than anything else comparable would be in their hands and take to Ki augmentation particularly well", 1, Table_Resolver(42));
    Add_Prize(300, "Prized Bloodline", "Certain fighters have specific talents, born of pure chance or breeding programs that might have gone on for generations. Not only can you identify the martial talents put in front of you, you can also isolate and replicate these factors in others", 1, Table_Resolver(42));
    Add_Prize(300, "Strict Diet", "You are what you eat. Not only do you know what food is best for what purposes, but based on the resources you have available to you, you also know how to create the optimal possible diet for any given outcome, significantly accelerating progress. This also works for abnormal nutrition requirements like specific kinds of blood for vampires or alternative fuel sources for androids", 1, Table_Resolver(42));
    Add_Prize(300, "Technique Scrolls", "Getting the intricacies of martial technique to survive you is tricky. Martial arts are not often best described by words and pictures. But you can do it. In fact, you know exactly how to produce instructional materials of all kinds that are incredibly instructive items capable of perfectly pouring knowledge into even the poorest of pupils", 1, NULL);
    Add_Prize(400, "Strange Concoctions", "These substances work far better than they should. Taking advantage of the supernatural qualities of Ki, these substances are able to perform feats that could be considered miraculous. They can cure mortal wounds, grant immense stamina or incredible strength or speed", 1, Table_Resolver(42));
    Add_Prize(500, "Extreme Training", "Ki makes things that might seem impractical entirely possible. Be it carrying around massive rocks, or dodging arrows blindfolded, you know how to get extreme results from extreme effort, the more extreme the better", 1, Table_Resolver(42));
    Add_Prize(400, "Training Grounds", "You know how to organize a space in such a way that it is perfect for particular uses, to a supernatural degree. Through the careful application of Ki and the flows of energy, you can create spaces that accelerate training or indeed any other specific activity", 1, NULL);
    Add_Prize(500, "Animalistic Skill", "It is said that the old masters learned to fight by observing the movements of animals, producing various schools of martial arts. At their height these warriors were capable of nearly magical feats, replicating the inhuman capabilities of these creatures. With study and training, you can now also replicate some of the physical feats of these creatures.", 1, Table_Resolver(42));
    Add_Prize(300, "Honor Vow", "There are ways to… concentrate your existence. To focus your presence. Even without supernatural influence dedication has its effects. With Ki, however, this effect is magnified, not only providing you a general bonus as you hold to the terms of your oath, but also significantly increasing your capabilities as you close in on the target of your Vow", 1, Table_Resolver(42));
    Add_Prize(750, "Conservation of Ninjutsu", "The faceless, diffuse actions of a mass of efforts, often not entirely aligned means that only so much force can be brought against a single foe. You now have the stamina and strength to take advantage of those gaps in co-ordination. As the number of enemies grows the more of these gaps exist and the easier you find the fight.", 1, NULL);
    Add_Prize(1000, "Berserker State", "Through careful training, the matter of Fight and Flight is answered. In various situations, you can call upon a deep reserve of power and durability able to act unfettered by any injury and disregard any pain you may be in.", 1, Table_Resolver(42));
    Add_Prize(500, "Vital Spirit", "There are limits to power, ends to your strength, but sometimes you need to push past it, regardless of the cost. There are limitations built into any mortal form. And there are ways to push past them. You can effectively 'cast from hit points' empowering your other abilities at the cost of damaging yourself.", 1, NULL);
    Add_Prize(500, "Final Breath", "In one final gasp, in an exertion where you have nothing to loose, you can draw upon the last dregs of your strength with utter abandon, increasing your capabilities by orders of magnitude for a short period, though this does significantly damage your mortal form. It will take quite some time for you to recover and even the most powerful restoratives and procedures applied will be of minimal help.", 1, Table_Resolver(42));
    Add_Prize(400, "Accelerated Recovery", "You know how to call upon your Ki in such a way that it accelerates the process of healing while not only retaining but even improving the benefits of such exertion. Your body adapts to strain more quickly and without issue.", 1, Table_Resolver(42));
    Add_Prize(200, "Mirror Moves", "An enemy can be the best teacher sometimes, and when it comes to you, that is most definitely true. You easily pick up moves, tricks and skills used against you, identifying them almost immediately and only needing another one or two examples to fully internalise it.", 1, NULL);
    Add_Prize(200, "C-C-C-Counter!", "The limitations of the physical form cannot be overcome through skill alone, and there are always compromises to be made. Compromises that you can easily identify. From even a single example, you know what you need to do in order to counter any specific move of means of attack, though leveraging that information is a matter of your own skills.", 1, NULL);
    Add_Prize(200, "Perfect Flow", "Skill in battle is not just about what you know, but how you put it into practice. You have a particular talent for efficiency, able to efficiently execute your intended movements without a single wasted calorie of effort. This carries over into the rest of your life, granting you a certain undeniable presence.", 1, NULL);
    Add_Prize(400, "Alchemic Symbols", "There are patterns, esoteric symbols that form the basis of alchemy. They require not particular affinity, merely knowledge of their function and the right training in order to enact simple instantaneous effects. You can receive this perk up to five times, the first granting your access to the core four (disintegration, cleansing, assembly and stasis), the next granting your effigies of the states of  matter and energy (solid, liquid, gas, plasma etc and heat, mass, light etc). The third grants you access to the four base conceptual elements (fire, water, earth, air) and the fourth grants you the Unreal Words (spirit, thought, motion, divinity, stories, ideas etc). The last, however, grants you every remaining word allowing you to describe anything in alchemical terms.", 5, NULL);
    Add_Prize(300, "Transmutation Arrays", "These complex arrangements of alchemical symbols allow you to enact various alchemical processes in such a way that you can chain together a series of symbols representing various items in order to enact transmutations, alchemical processes that transform items. The first time you receive this perk your main focus is in altering the structure of items, retaining the same materials. The next allows you some control over their form, allowing you to transform items into other things so long as they are generally similar. The last stage grants you sufficient understanding to reduce objects their base materials and reconstruct them into entirely new forms.", 3, Table_Resolver(64));
    Add_Prize(300, "Destruction", "This grants you a deep understanding of the fundamental concept of destruction, the ability to render something down to parts and components.", 1, NULL);
    Add_Prize(300, "Purification", "You gain an intuitive understanding of the process of purification, of how to remove impurities from any substance, returning it to a pure state.", 1, NULL);
    Add_Prize(300, "Construction", "You know how to combine various materials in order to create complex substances, allowing you to create new materials and mechanisms that allow you greater flexibility.", 1, NULL);
    Add_Prize(300, "Stability", "You know how to finish an alchemical process, rendering the result of your works as permanent as if the product was natural. A Stable alchemical creation is as real as any natural equivalent", 1, NULL);
    Add_Prize(500, "Elixir of Life", "You know how to create an alchemical substance that can de-age living things, extending their lifespan. This requires difficult to get ingredients and is a complex process even for the best alchemists.", 1, NULL);
    Add_Prize(500, "Panacea", "You know how to create an alchemical substance that can heal any injury or cure any disease. It is very difficult to make, even for the greatest alchemists and requires rare ingredients.", 1, NULL);
    Add_Prize(750, "Philosopher Stone", "You know how to suspend the alchemical process, producing a stable energy that can act as a universal source for any alchemical process. This can even substitute for some of the ingredients of complex alchemical works.", 1, NULL);
    Add_Prize(1000, "The Great Work", "You know how to alter the very fundamentals of reality, refining objects in such a way as they are more perfect in some way, approaching the conceptual ideal of what it means to be that object. This allows them to act more effectively when used for their intended purposes.", 1, NULL);
    Add_Prize(500, "Atomic Synthesis", "You know how to bypass the usual material constraints of Alchemy, transforming the vary materials that compose physical items. By breaking things down to the subatomic level, you can reassemble the building blocks into new elements and substances.", 1, NULL);
    Add_Prize(750, "Automated Alchemy", "Alchemy is normally a manual process, involving the direct intervention of the alchemist in question. However, you know how to account for every stage of the transmutation, allowing them to be operate entirely independently.", 1, Table_Resolver(65));
    Add_Prize(400, "Chimeric Creations", "Given the complex nature of living systems, working with them in alchemical procedures is always a challenge. However, it is possible to treat living components as something of a black box, combining them to other systems through alchemical processes. Though this can be a little... crude in appearance.", 1, Table_Resolver(64));
    Add_Prize(350, "Living Alchemy", "Life is extremely difficult to effect through alchemical processes. As a complex and chaotic environment, working any alchemy on a living thing is incredibly difficult, but you now understand how to account for these things, allowing you to heal and otherwise manipulate a body.", 1, Table_Resolver(64));
    Add_Prize(500, "Homunculi", "Creating animate objects is considered one of the greater alchemical feats. And it is one that you are now capable of. Though this does not grant the knowledge required to produce minds with true intelligence, you can encode any form of logic you can understand.", 1, Table_Resolver(64));
    Add_Prize(300, "Bloodline Transmutation", "You know how to embed alchemical understanding into the very essence of beings. This enables the being to more easily enact alchemical processes that involve this knowledge. However, the difficulty increases with the scope of the knowledge inserted. Most beings have trouble holding more than a single secret.", 1, Table_Resolver(64));
    Add_Prize(500, "Simplified Transmutation", "You know how to reduce the usually complicated process associated with alchemy into much simpler forms. Indeed, some processes can be reduced to such a level that they can be held entirely in the mind, allowing a person to enact transmutations without external aid.", 1, Table_Resolver(65));
    Add_Prize(300, "Complex Creations", "You know how to encode extremely complex structural information into your alchemical processes, allowing you to produce complex items such as machines with many moving and independent parts.", 1, Table_Resolver(64));
    Add_Prize(1200, "Alchemic Reversion", "Though it may seem that alchemical  transmutations are perfect, you know how to pick at the seams of such things, allowing you to reverse various alchemical processes. Though, some are easier than others. The quality of the transmutation factors heavily into how perfectly something has been altered and thus the difficulty in reversing any such changes.", 1, Table_Resolver(64));
    Add_Prize(0, "Magic", "The ultimate expression of mysticism, this grants you a supply of that arcane energy that is permits so many forms of supernatural capabilities. Though you are no archmage, your capabilities are not weak either. This grants you additional power equal to a mediocre mage, capable of learning most spells.", 255, NULL);
    Add_Prize(300, "Wishes and Dreams", "Magic, ultimately is about belief. It is about effect following cause, even when the physical realities don't align. From the greatest rituals to the least cantrip, it is this foundation that persists, and one that you understand on a fundamental level", 1, Table_Resolver(83));
    Add_Prize(600, "Enchanting", "Magic is effect. It is the result of arcane intention enforced unto reality. So often that means that it is transient, ephemeral. But you know how to bind it. Though thematic substrates will make it easier, you are able to bind a mystical effect to any item and engage the result repeatedly though perhaps with a cooldown depending on the scale of the effect.", 1, Table_Resolver(83));
    Add_Prize(200, "Arcane Focus", "Manipulating magic takes imagination, focus, knowledge and power. While some things are dependent on the wielder you can make it easier to focus, at least. From augmenting a mage's focus directly or simply offloading some of the strain, you know how to make tools that ease the process of performing arcane acts.", 1, Table_Resolver(83));
    Add_Prize(300, "Potioncraft", "Ah, those flasks of mysterious fluid all sitting pretty on the shelf. You know the intricacies of how ingredients interact and the subtle power that lies within a cauldron. You know what ingredients can be substituted for each other and how call the sparks of magic from what seems like mundane materials.", 1, Table_Resolver(83));
    Add_Prize(600, "Rituals", "Grand desires often entail grand action. This is true in magic just as it is in other ventures. Through sacrifice both material and symbolic you know how to vastly increase the scale at which your magic can function.", 1, Table_Resolver(83));
    Add_Prize(900, "Geomancy", "Ley Lines, Genus Loci, Places of Power... all of these have immense arcane might that you can turn to your ends. You can manipulate and even create these artefacts.", 1, Table_Resolver(88));
    Add_Prize(550, "Divination", "To be a wizard, witch or even sorcerer is to be someone with wisdom or knowledge beyond common ken. And magic has many ways of gathering that information. You have a talent for various forms of divination - that inner eye that you can hone with sufficient practice", 1, Table_Resolver(83));
    Add_Prize(400, "Grimoire", "Simply storing arcane lore is difficult, knowledge is power and powerful magic is often not particularly predictable. You however, know how to encode magical secrets in a manner that is safe and understandable, allowing you to ease the process of working complex acts. These methods also happen to be great at handling all kinds of exotic knowledge.", 1, Table_Resolver(83));
    Add_Prize(300, "Portals", "Being able to access distant locales has always been a dream of mages, and is particularly useful when it comes to transporting large amounts of material or people. This ritual can be customised to produce a portal of any shape, size or duration to a destination you can adequately describe, though as those factors become greater, harder to describe or encounter various obstacles (even simple distance), the difficulty of the ritual and the quality of the required reagents increase.", 1, Table_Resolver(85));
    Add_Prize(200, "Teleportation", "You are here, and now you are not. You now have knowledge of a spell that allows you to teleport yourself, and sufficient understanding to alter it to affect others and even groups, though that increases the cost and complexity.", 1, Table_Resolver(84));
    Add_Prize(250, "Fated Blow Enchantment", "You know how to enchant projectile weapons such that they will always hit their target. From named bullets to spears that would weave around obstacles, this enchantment can be tweaked and optimised for a variety of expressions.", 1, Table_Resolver(85));
    Add_Prize(100, "Elemental Enchantment", "You can enchant objects in such a way so as to have them generate effects aligned with various elements, and can fine tune the expression to take on various forms. From blades that can send out blades of razor-sharp wind to hammers that shatter the earth, this can take on a vast variety of forms.", 1, Table_Resolver(85));
    Add_Prize(150, "Fey Food", "The line between exceptional cooking and a magical ritual is a blurry one, and you know how to push that boundary in a variety of ways. You can produce food that is not only supernaturally delicious, but can act as a medium for a variety of supernatural effects.", 1, Table_Resolver(87));
    Add_Prize(500, "False Life", "You can create an emulation of life, an enchantment that animates objects and allows them to react to objects according to a fixed, preset personality. Though convincing, these creations are not truly sapient, and operate on a fixed capability.", 1, Table_Resolver(84));
    Add_Prize(200, "Flight Enchantment", "Taking to the skies is a primal dream of almost every people, to shed the shackles of the earth. It is unsurprising that every magical tradition has some means of allowing flight.  You know a variety of spells and enchantments that allow you to enable things to fly.", 1, Table_Resolver(85));
    Add_Prize(150, "Speed of The Wind", "You now have knowledge regarding a series of enchantments that allow you to grant objects and their users supernatural speed. While reaching the speed of sound is relatively simply, the complexity quickly grows beyond that point.", 1, Table_Resolver(85));
    Add_Prize(100, "Invisibility", "The shadows are your friends. It is almost like you have spent a lifetime studying them, gleaning the arcane secrets of stealth from their depths. You have a deep understanding of a class of enchantments that enable stealth, and the foundation necessary to develop more complex and powerful versions of them.", 1, Table_Resolver(85));
    Add_Prize(400, "Dark Forces", "Perhaps you delved too deep, or passed certain boundaries. You've stumbled across secrets that would be unsettling to most. But they are powerful, and maybe that is just what you need. There is power in shunning the shackles of the mundane, to consider options that most would not.", 1, Table_Resolver(83));
    Add_Prize(1200, "Geass", "You can create an agreement between two or more people that they are forced to uphold. Barring escape clauses written into the agreement at the time of creation, there is no way to break these bonds.", 1, Table_Resolver(88));
    Add_Prize(300, "Mystic Materials", "Magic can bring out all sorts of strange properties in otherwise mundane materials. While this is usually due to complex natural processes, you know how to precipitate magic in the structure of previously mundane materials resulting in permanent transformations as magic becomes a permanent part of their existence.", 1, Table_Resolver(84));
    Add_Prize(0, "Eldritch Mind", "Some people say that there are things that mortals were not meant to know. You disagree, sometimes it just takes a special mind. And you happen to have one such mind, capable of handling even the most unnatural of thoughts", 1, NULL);
    Add_Prize(600, "Equivalence", "It's all the same at the end of the day. Everything at the most base level is energy, and were all once part of a greater whole. You know how to reach back to that primordial state and convert one from of energy into another.", 1, NULL);
    Add_Prize(750, "Though the Dreamer Wakes", "The world may be a dream, you are not... or are you? Perhaps you are simply a thought, some persistent whisper in the minds of the grand cosmic existence. Whatever it is, you can persist past the end of the universe, and await the birth of the next.", 1, Table_Resolver(104));
    Add_Prize(500, "Strange Angles", "You know there is more to the world that others see, layers and angles to eternity. Strange Places where wrong is right, where shadows are cast over eternal light. Though they may seem as dreams you know what lays beyond the world's seams.", 1, Table_Resolver(104));
    Add_Prize(500, "Nothing but a shadow", "We are but shadows of something great, a soul perhaps or some other state. There is more than up and down, left or right. There are things move beyond the night.", 1, Table_Resolver(104));
    Add_Prize(500, "When the stars are right", "The universe extends into places unknown, with existence itself weighing it down. What waters lay at the bottom of gravity wells? A paradise perhaps or unknown hells. When the stars align, streams combine. Trickles gather into torrents and with eerie portents, mysterious machines enact strange schemes.", 1, Table_Resolver(114));
    Add_Prize(250, "Strange Places", "There are strange places in the world, where doors do not lead where you expect and distances seem inconsistent. Where even trying to map them out can lead to madness. Some are natural, others are not and now you know how to create them.", 1, Table_Resolver(104));
    Add_Prize(200, "Eldritch Tongues", "There are many languages that mere mortals cannot properly speak, or on some cases understand. Vocalisations beyond the capabilities of lesser beings. That limitation does not apply to you. Not only can you generate any noise that you wish but you can also decipher any language - spoken, written, signed or otherwise communicated - but you also learn them incredibly quickly. As a side effect you can also learn any mortal language with a few hours of exposure and mimic and voice or accent after a few minutes.", 1, Table_Resolver(104));
    Add_Prize(350, "An extrusion", "The forms that cosmic forces take on in the mortal realm are not their true selves. Such things are too great to exist without destroying existence. Instead, they are extrusions, miniscule fragments of their power, like the end of a pair of tweezers poking at reality. You can now replicate this feat, retracting the majority of your existence into yourself and exposing only what you wish. Should you be strong and mentally powerful enough, you might even be able to summon multiple such extrusions.", 1, Table_Resolver(104));
    Add_Prize(1200, "Laws", "You know how to create spaces with altered physical laws, through  the manipulation of the Aether, you can effectively create spaces where the natural laws are something other than the familiar physics of your universe.", 1, Table_Resolver(290));
    Add_Prize(400, "Cosmic Wells", "Beneath all of existence, there exist infinities unseen. There are ways to pierce the limited illusion of existence, calling forth power from beyond what mere mortals are able to comprehend. This can be turned to a variety of ends, though the simplest would be in the form of light and heat.", 1, Table_Resolver(104));
    Add_Prize(350, "Servitors", "Sometimes greater forces cannot act on such miniscule levels, and thus have need of tools with a certain… delicacy. You understand how to replicate these processes, creating constructs with strange capabilities, some that may seem fantastical to your average mortal.", 1, NULL);
    Add_Prize(200, "Altered Existence", "Such menial beings cannot withstand the presence of a greater power. And now that you know how to summon those forces, you can raise these pathetic mortals into something more worthwhile. These new creatures can be stronger, faster, more long lived through may be affected in other ways in a much less predictable manner.", 1, Table_Resolver(104));
    Add_Prize(300, "A Calling", "Your name is special… No, not your common name. Your full name. You have gained a title, which forms the basis of an Invocation. To use this is to refer to you, and you are aware, to an extent of when it is used. However, when this title is used in conjunction with other ways to identify you (other titles or even your personal name) this becomes a true Calling. A means of granting you awareness of the situation in which you have been invoked.", 1, Table_Resolver(104));
    Add_Prize(750, "Beneath Notice", "Mere mortals are to cosmic forces less than the least speck of dust is to them. While unsettling, this does have its advantages, and you can extend these advantages to other levels of existence, rendering yourself so utterly beneath notice that you are effectively undetectable.", 1, Table_Resolver(104));
    Add_Prize(100, "Warding Glyph", "You can place a glyph, a simple two-dimensional shape that extends into higher dimensions. This produces an unpleasant sensation that can affect even Higher Beings, encouraging them to avoid the area. This is not a true defence, however, as it will crumble against any focused effort.", 1, NULL);
    Add_Prize(250, "Walk Upon the Firmament", "You tread not upon the base earth, but upon the foundation of all existence. You can find footing anywhere, even upon the very vacuum of space and be as stable as you would be on solid ground.", 1, Table_Resolver(104));
    Add_Prize(1200, "Cosmic Logic", "At a certain scale, laws once thought inviolable are revealed to be… malleable. Your existence is now great enough that your actions and reactions supersede normal reality allowing you enforce your own alien logic on the situation at hand. This is still extremely strenuous so can only be done in short bursts.", 1, Table_Resolver(104));
    Add_Prize(200, "Watchers from Beyond", "You gain a limited line of communication to a group of observers from… elsewhere. Though their perspectives are alien to you they are incredibly intelligent and learned, allowing them to comment on your plans and even peer-review your research and designs. They may also occasionally send you small trinkets of snippets of prophecy.", 255, NULL);
    Add_Prize(500, "Outside Influence", "There are signs. There are always signs. Even if you don't know what you are looking for, the simple fact that reality does not align itself with your predictions can only mean that there is something you don't know about. You have a particular talent for noticing such things, and are able to discern the existence of unknown or even hidden influences on a situation with sufficient study.", 1, NULL);
    Add_Prize(200, "Esoteric Affinity", "While you might not know exactly what something is, you can make observations and test theories. It is enough a toehold that with a little experimentation, you can develop technology to make use of any phenomena, regardless of how strange it might be.", 1, NULL);
    Add_Prize(750, "Must Be Seen To Be Believed", "There's a certain… otherness to you. You don't quite fit in with reality. It takes a great deal of evidence for something to accept your existence. And while the human mind has other ways of sharing information, the mechanisms of the world have no such defence. All means of remote viewing and detection will fail, your presence being rejected from reality as it leaves your immediate field of influence.", 1, Table_Resolver(104));
    Add_Prize(200, "Sterner Stuff", "Sometimes it's simply too dangerous to go alone. Take this. You now are durable enough to survive the passive dangers of any natural environment", 1, NULL);
    Add_Prize(750, "Pocket Planes", "You know how to create limited infinities. Though this void contains nothing at all, it is, ultimately, boundless.", 1, NULL);
    Add_Prize(500, "Material Planes", "You know the mechanics that govern the branching paths of time itself. You understand what it would take in order to access these other worlds and how to navigate this intricate web", 1, NULL);
    Add_Prize(500, "Mirror Planes", "There are many axis upon which the world may turn, and you know how to look across them. There are worlds where seemingly arbitrary factors are flipped, gender, morality perhaps even species. You know how to chart these paths and how they fit in the wider web of time", 1, NULL);
    Add_Prize(500, "A Lonely Spark", "Life... doesn't always find a way. In fact, most of the time it doesn't. The majority of worlds are dead, empty of people and their works, and you know how to access these universes", 1, NULL);
    Add_Prize(500, "The Elemental Planes", "There are worlds out there quite unlike your own, places where simple matter is not what underlies existence. Without that foundation, more abstract concepts may run free producing bizarre and alien realms. Without some way of surviving these distant realms you cannot travel there, but you do know how to connect to these distant worlds.", 255, NULL);
    Add_Prize(300, "The Cycle", "Souls are real, you know that, and through observation of their passage you have become aware of other places they go to, drawn through a mystical network of bonds and connections. You have uncovered how to connect to one of these afterlives, though surviving there is another matter. You gain access first to the realm in which you are likely to end up in, and then to those that people you know will inhabit by level of familiarity", 255, NULL);
    Add_Prize(500, "The Bindings", "If all these realms are clustered together, what holds them as such? There is a non-place, a pseudo-existence without an inherent nature. Here even concepts like time are not guaranteed, everything simply EXISTS. You know not only about this place, but how to access it, and how to interact with it", 1, NULL);
    Add_Prize(350, "Planar Ship", "You understand the mechanisms of the boundaries between realms and how to manipulate them in such a way that you can launch a small pocket of existence between them, creating a vessel of sorts that can travel between realms.", 1, NULL);
    Add_Prize(350, "Shift Tool", "Transporting discrete items between realms is often easier than transporting some arbitrary volume, on account of broader interplanar physics. It is these delicate interactions that you now have a prodigious grasp on, allowing you to design systems that allow you to shift objects from one realm to another", 1, NULL);
    Add_Prize(350, "Portal Projector", "In the right circumstances, travelling between the realms can be as simple as taking a few steps. Indeed, in some planes, natural portals exist that make such a thing a simple enough task. It is this phenomenon that you understand as though you spent a lifetime researching it, and can now replicate.", 1, NULL);
    Add_Prize(300, "Paramatter", "The nature of realms is a strange one, these adjacent domains where the rules of reality are utterly alien. To most these are entirely separate places, but you now know how to straddle the line between them. At the most basic level, you may simply displace part of an object to the other realm, creating seemingly disconnected pieces that nonetheless move in unison, but should you know of more interesting realms, the object may take on traits from both worlds.", 1, NULL);
    Add_Prize(200, "Farspace", "This realm is an interesting one, with physics and mechanics quite unlike the material realms most are familiar with. Through a series of calculations and manipulations, a properly protected craft or signal can transit through Farspace to locations at an effective speed greater than that of light, often by orders of magnitude. Your grasp of the mechanics of this place is now such that it is only your ability to calculate and generate the necessary effects that limit your ability to traverse real-space.", 1, NULL);
    Add_Prize(250, "Trans-Realm Interstellar Porter", "This realm is an interesting one, with physics and mechanics quite unlike the material realms most are familiar with. Through a series of calculations and manipulations, a properly protected craft or signal can transit through Farspace to locations at an effective speed greater than that of light, often by orders of magnitude. Your grasp of the mechanics of this place is now such that it is only your ability to calculate and generate the necessary effects that limit your ability to traverse real-space.", 1, NULL);
    Add_Prize(500, "Phase Field", "A phase field is technically a byproduct of true planar technology, and is part of the systems that allow for transit between planes. By stabilising this normally intermediate state, you can control the interactions between an object and its surroundings, rendering them effectively intangible and only able to touch the things they desire to.", 1, NULL);
    Add_Prize(300, "Hidden Workings", "You know how to project the effects of your creations across planar boundaries, allowing things done in one plane to affect others. This can create seemingly mystical effects, or create devices that seem to be much smaller than they otherwise would have to be.", 1, NULL);
    Add_Prize(250, "Idyllic Retreat", "Due to a confluence of various factors, this plane is particularly interesting. While veritably paradisical due to the inability of anything within to cause serious harm to anything else, this world does have something of a drawback. Nothing can be permanently introduced and only memories can be brought back. Additionally, there is something of a stasis that exists, almost as if the world itself is happy the way it is.", 1, NULL);
    Add_Prize(450, "Adaptive Existence", "You can refract yourself, in a way, into a form that better suits the plane you are currently occupying. And, assuming you have a means of calling upon the energies of those other planes, you can also take on these alternate forms elsewhere.", 1, Table_Resolver(126));
    Add_Prize(200, "Foreign Associates", "When travelling to a new plane, you become aware of a local faction (should any exist) that would be amenable to trade and/or cultural exchange with a reasonable amount of effort. This knowledge is generally limited to their approximate location and a general sense of cultural taboos.", 1, NULL);
    Add_Prize(800, "Flow-gistics", "To work with fluids is to work with change. That is a fundamental truth you must come to terms with. Through exhaustive effort and constant analysis, you have come to understand exactly how systems will evolve. As long as you know the starting state of the system you can predict the outcome with only factors you were not aware of altering the outcome.", 1, NULL);
    Add_Prize(200, "Steam Powered", "The advent of steam transformed humanity, allowing them to surpass the limits of flesh and bone. This grants you a fundamental understanding of how steam can be manipulated an put to use. As long as you know what you want to do and it is possible to do so, you find yourself able to produce effective mechanisms. This also extends to broader pneumatic theory employing all manner of compressible fluids", 1, NULL);
    Add_Prize(200, "Hydraulics", "Pistons, compressors and all manner of mechanisms allow for the transmission and transformation of force in its purest form. You have an intuitive understanding of how to manipulate pressure, travel and work of all kinds through the medium of incompressible fluids.", 1, NULL);
    Add_Prize(200, "Macro-fluidics", "You understand the subtle intricacies of working with fluids of all kinds. Not only simple motion but mixing, filtering, transporting and storing these materials on a grand scale.", 1, NULL);
    Add_Prize(200, "Seismo-Fluidics", "The nature of fluids is truly a matter of scale. Across the right timescales and in the right conditions, everything is fluid and you know how to leverage those properties to your own ends.", 1, NULL);
    Add_Prize(500, "Artificial Intelligence", "Beyond logic lies the realm of true intelligence. To be able to learn and act independently of any outside force. You now know that process innately, and are able to create artificial intelligences to whatever end you wish. Though your creations are truly realised people, you know how to construct them to want what you want them to want.", 1, NULL);
    Add_Prize(150, "Semiconductor Revolution", "Making rocks think is frankly magical, a culmination of understanding that seems to run up against the boundaries of the material realm itself. And you are now exceptional at understanding the mechanics, properties and theory behind all of it", 1, NULL);
    Add_Prize(150, "Optical Computing", "Sometimes you need to go fast. Through the complex quantum interactions of electromagnetic waves with various optical medium, you can use light as a medium of logic. You now have a deep intrinsic understanding of how optical interactions can be applied to logical process", 1, NULL);
    Add_Prize(150, "Organo-chemical Computing", "Nature has come up with all sorts of interactions, coming up with a form of intelligence that is extremely difficult to match in terms of capability and efficiency. you can now turn that to your own ends, producing incredibly robust and adaptable biological computers.", 1, NULL);
    Add_Prize(150, "Micro-fluidics", "You understand the subtle intricacies of working with fluids of all kinds. Though generally not considered a medium of logic, fluids have myriad benefits when it comes to working with many classes of problems and can bridge the gap between computation and physical processes.", 1, NULL);
    Add_Prize(150, "Mechanical Computing", "There are many ways to solve a problem, but perhaps the earliest is through physical tools. Be it clockwork or simple geometry, you know how to create physical structures and systems that will produce solutions to the problems you pose.", 1, NULL);
    Add_Prize(150, "Nano-Computing", "You can turn the very building blocks of the universe into a medium for computation. You know the little secrets behind encoding information and processing logic on the scale of atoms themselves.", 1, NULL);
    Add_Prize(300, "Electro-", "You have a deep understanding of the quantized expression of this omnipresent force. You not only know how to generate and manipulate electrical systems, producing intricate systems of interactions, you can also turn them to all sorts of interesting and unique outcomes.", 1, NULL);
    Add_Prize(300, "Magnetism", "You have an unerring understanding of the fundamental properties of this omnipresent force. You not only know how to employ magnetic fields to great effect, but also are able to design complex field structures that can produce all sorts of interesting and unique outcomes.", 1, NULL);
    Add_Prize(300, "And Let There Be Light!", "You are a master of photons, those quantum waveforms that impinge so easily on the material world. You have a deep and intuitive understanding of how photons act and interact with both energy and matter", 1, NULL);
    Add_Prize(400, "Gravitics", "The very fabric of space and time is bent and stretched by every little thing, and you know how to take advantage of that. You know how to replicate artificial gravity wells and hills and even the beginnings of more complex space-time structures", 1, NULL);
    Add_Prize(400, "Massive", "Everything in the universe has mass, energy bound and stabilised. While you do not yet know how to produce or remove matter, there is one aspect you have learned to control. You now know how to manipulate the Higgs Field, altering inertia and momentum to all sorts of ends.", 1, NULL);
    Add_Prize(400, "The Strong", "What truly holds the world together? At the core of every atom lies the strong nuclear force. Limited by distance but immense in strength, you now know how to manipulate it, creating dense durable substances and rendering unstable isotopes safe to handle", 1, NULL);
    Add_Prize(400, "The Weak", "The power that underlies nuclear fission itself. This is a force is uniquely transformative and has myriad uses, and you know just what they are. From accelerating normal fission reactions to force fields, you are able to induce the rare reactions and shape the weak nuclear force to turn it to your own ends", 1, NULL);
    Add_Prize(200, "Blacksmith", "Though fire and force, you shape the very blood of the earth. This grants you the skill necessary to shape metal to your will through various manual tools such as hammers, punches and anvils", 1, NULL);
    Add_Prize(200, "Machinist", "The strength of humanity lies in tools. And you know how to use tools to reach past the limitations of your flesh and bring forth what lies in your mind. You have an eye for precision and an intrinsic intuition on the best materials for the job.", 1, NULL);
    Add_Prize(200, "Carpentry", "Wood is perhaps the first material humanity ever turned to their own ends. Though it may not be the strongest or toughest substance, it has its own benefits and you know how to bring them forth. You are able to work with any wood producing immaculate and functional works of art.", 1, NULL);
    Add_Prize(200, "Ceramicist", "It takes immense skill and planning to turn what may seem like sludge into some of the most intricate and capable materials in existence, but you have a deep understanding and exhaustive knowledge of this art that makes it seem easy.", 1, NULL);
    Add_Prize(200, "Roping", "From cables to cords, your realm is that of ropes, chains, wires and filaments of all kinds. String is perhaps the tool that separated people from animals, artifice of a kind that seems to be solely the product of an intelligent mind and you know how exactly to make and use it from almost any material.", 1, NULL);
    Add_Prize(200, "Leatherwork", "Perhaps one of the first ways that people protected themselves from the elements. Your skills extend far beyond the simple flayed flesh of creatures, allowing you to easily make use of any thick, flexible material that could be considered 'leather' of some sort.", 1, NULL);
    Add_Prize(200, "Textiles", "You can work with cloth. Be it the finest silk or the most advances space-age fabrics, you know how to get it to do what you want it to do. Be it clothes, sails or even tents, you can make it happen", 1, NULL);
    Add_Prize(200, "Resins", "Resins take a careful eye and a keen intuition, qualities that you now have. You can not only extrapolate the perfect properties a resin would need to have for a situation, but you can also apply resins you have access to in the most ideal manner", 1, NULL);
    Add_Prize(200, "Glasswork", "This ancient art remains in use to this day. From the lab to industry, working with molten materials especially at the extreme temperatures needed to render glass fluid is a skill that takes a lifetime to master, granting the skills you now have", 0, NULL);
    Add_Prize(200, "Nanofabrication", "From photolithography to chemical resists and even high-precision machining, you know exactly how to produce nano-scale structures through the use of macroscopic tools.", 1, NULL);
    Add_Prize(200, "Nanoengineering", "Working at the scale of atoms and molecules is a whole different ball game. At this scale the classical physics that govern most engineering are flexible and you know how to take advantage of that, producing mechanisms that work effectively on this miniscule scale", 1, NULL);
    Add_Prize(200, "Nanoassembly", "You know how to make the atoms dance. Not only do you know how to direct the nano-bots you can to the best of their abilities, you also know what you need nanobots to do in order to produce objects engineered at the scale of atoms themselves", 1, NULL);
    Add_Prize(200, "Additive manufacturing", "3D printers of all kinds have transformed production, but they come with their own quirks. You know precisely how to make best use of these systems, taking advantage of their strengths and accounting for their limitations", 1, NULL);
    Add_Prize(200, "Biomanufacturing", "The production of complex chemicals and compounds is often best achieved through the use of an organic carrier. You know how to modify simple organisms in a manner that allows you to engineer a system for producing any homogenous substance you care to name", 1, NULL);
    Add_Prize(200, "Sculpting", "Sometimes the page is just not enough. Sometimes your vision cannot be limited to two dimensions. You now know how to render the sights of your mind's eye in physical form.", 1, NULL);
    Add_Prize(200, "Engraving", "From delicate tracery to stark gouges, it does not take pigment to send a message. You know what it means to mark something, beyond simply scratching a line.", 1, NULL);
    Add_Prize(200, "Cooking", "You know what it means to make food. From lovingly personalised home cooking of family kitchens to the standardised perfection of professional outfits, your skills are never found wanting.", 1, NULL);
    Add_Prize(200, "Pharmacology", "The intricate biochemistry of the body is an incredibly delicate dance, and without a clear understanding of how it all interacts you can't be sure how different chemicals will affect the body. However, that is no longer a problem for you. Not only do you have a perfect understanding of the biochemistry of your own body, but are rapidly able to expand that knowledge with a little study of any creature.", 1, NULL);
    Add_Prize(200, "Surgery", "Physically modifying a living creature is a delicate process, one that requires a deep understanding of the intricate systems that exist in every part of a body. But that is not a concern for you. In addition to a perfect understanding of your own body, you can rapidly build on this knowledge with some study of any organism", 1, NULL);
    Add_Prize(250, "Hologram Emitters", "These devices are small concealable projectors, allowing you to generate light in a certain area of effect. You have designs for various classes of these, with various levels of wavelength control, directionality, range and power levels.", 1, NULL);
    Add_Prize(250, "Barrier Generator", "These devices impart a force onto any object within a certain distance of them, the range, maximum strength, directionality and precision are somewhat customisable within the scope of your designs.", 1, NULL);
    Add_Prize(350, "Warp Drive", "This gravitic engine can unlock the stars. Through careful manipulation of the space-time geometry surrounding a craft, you can relocate the contents of a specific volume at what are effectively superluminal speeds. You have a set of scalable designs whose speed depends on the radius of the primary warp coil, a circular structure that must surround the rest of the craft.", 1, NULL);
    Add_Prize(500, "Structure Field Nodes", "These devices vastly augment inter-molecular forces, creating a sort of non-newtonian effect that allows for extremely rapid force dispersal across an entire structure. This in effects causes it to act as a perfect rigid body. These fields require a certain density to propagate and get weaker the further they are from the nodes in question.", 1, NULL);
    Add_Prize(500, "Polycrystalline Hypercomposites", "This class of engineered materials display a wide range of incredible properties. From the tensile strength required to make ringworlds to durability capable of handling relativistic micrometeorites you can produce materials with a wide range of capabilities. Even high temperature superconductors and superlubricants are available to you.", 1, NULL);
    Add_Prize(250, "3D-Computing Substrate", "You know how to create a series of logic gates that allow for the routing of electronic signals in 3D space while still performing logical operations. The real secret, however, is heat management. The materials used not only conduct heat well, but form structures that accelerate heat transfer, allowing for immensely dense computational equipment.", 1, NULL);
    Add_Prize(250, "Logic Crystals", "These crystals allow for the manipulation of light in order to perform complex logical processes across a broad range of wavelengths and polarizations, allowing for an immense speed of operation. However, due to wavelength limits these systems tend to have a fairly large minimum size, even if they are generally faster than other systems of the same volume.", 1, NULL);
    Add_Prize(250, "Superfluidic Gates", "Using precise control over surface tension and flow characteristics, you can create complex computational systems that can even have an impact on the physical world, with a particular strength towards analytical systems. Though the actual moving parts does tend to make them less optimal for pure computation and somewhat more power hungry.", 1, NULL);
    Add_Prize(250, "Hyperdense Neural Matter", "This optimised neurological tissue far surpasses any naturally evolved equivalent. Boasting complex interconnected ganglia and numerous chemical pathways, this provides for an incredibly robust and adaptable system that can be turned to a wide variety of uses. Of course, it does require some more regular maintenance, and can be somewhat less suited for precision applications.", 1, NULL);
    Add_Prize(150, "Reactionless Thrust Modules", "These self-contained devices produce thrust when supplied power. The maximum force they exert is dependent on their specific construction, but you have the designs for an entire range of these modules, from small nodes the size of your thumb that can produce a couple dozen newtons to immense engines larger than a small building that can accelerate vessels on the scale of cruise-liners at an entire G of acceleration.", 1, NULL);
    Add_Prize(100, "MyoSyn linear actuators", "These linear actuators have the unique benefit of having control requirements that very closely mirror biological systems. This massively reduces the overhead that comes with integrating with organic systems, either in the form of cybernetics or through a direct neural interface of some kind.", 1, NULL);
    Add_Prize(150, "Neural Interface", "From sub-cranial implants to simple external probes, you know how to make a number of different neural interfaces, though the resolution depends on the scale of the device and the invasiveness of the operations.", 1, NULL);
    Add_Prize(200, "Quanto-spatial Communicators", "While the precise details of the quantum mechanics in question are still being shaken out, there are some equivalencies between entanglement and wormhole technology. This system allows you transmit information instantly between two linked particles, so long as their quantum states remain linked.", 1, NULL);
    Add_Prize(100, "Fusion Core", "You know how to build various scales of fusion systems that can extract vast amounts of energy from hydrogen - even simple protium. While your containment systems usually limit the amount of energy that you can draw, your larger designs include a 'torch mode' which (while in a vacuum) can open up the reaction chamber to process more fuel. This does reduce efficiency, but can allow for greater power draw and allow the fusion plant to double as a propulsion system.", 1, NULL);
    Add_Prize(450, "Wormhole Gates", "This system allows the creation and preservation of a wormhole, with either end being preserved through a semi-passive frame. As long as the connection isn't disrupted, these can be transported relatively easily and allow for effectively instantaneous transit from one side to the other.", 1, NULL);
    Add_Prize(400, "Legacy", "The March can grant you access to many strange and unique abilities. While normally it would be for your children to carry forth your legacy unto this world, you may now trigger a similar awakening of any one of your powers in others through the means of a ritual granting them a basic level of access to this ability.", 1, NULL);
    Add_Prize(250, "Fundamentals", "You pick up things quickly, for the basics at least. Regardless of the field, you pick up a working understanding of it with only an hour's study and experimentation - enough to get a sense of how it will interact with your broader understanding of the world.", 1, NULL);
    Add_Prize(1000, "Sure Footing", "The laws of nature may take on infinite forms, but at the end of the day, you remain yourself. Regardless of the environment that you are able to operate as you wish and even enforce your natural logic should you choose to.", 1, NULL);
    Add_Prize(750, "All Access Pass", "It doesn't matter if it's an afterlife or some obscure demiplane, you are aware of all the little realms that exist in this universe and can transport yourself to them and handle the environmental dangers with ease.", 1, NULL);
    Add_Prize(500, "Skilled", "There's nothing you aren't at least decent at. You've tried your hand at so many things that your transferrable skills are enough to hum a few bars at practically any skill you are physically capable of.", 1, NULL);
    Add_Prize(1000, "From Whence It Came", "You can tell when and where something became what it is. You know who or what is responsible, and get a sense of the raw materials from which it was made.", 1, NULL);
    Add_Prize(500, "The Process", "You have trained and toiled. Your skills are unfathomable to almost everyone. You are a master in so many skills that your incidental knowledge puts your works so far beyond the best that even exceptional individuals could attempt to make. Anything you create will be the greatest example of its kind in existence.", 1, NULL);
    Add_Prize(1000, "As Clay", "You become able to work with any material as though it is a far simpler version of the same. Complex alloys are worked as easily as steel, dangerous fluids become as safe to handle as water and gasses no more difficult to manipulate than simple CO2", 1, NULL);
    Add_Prize(1000, "The Pattern", "Given enough examples of any particular type of object, you can come to know how it works, and if you have the ability to manipulate the substances involved even replicate it. Even without that, you know the capabilities of what you are working with, how to operate it and how to integrate it into your broader technological base", 1, NULL);
    Add_Prize(500, "The Three Rs", "You know how to make the most of your resources. Often times, the best materials aren't necessary for every application they are used in. You can substitute rare and precious materials for more common ones, retaining the same functionality, though perhaps lacking a little in quality or capability.", 1, NULL);
    Add_Prize(100, "Reclamation", "You are able to quickly and easily reclaim the materials that went into construction of any object, returning them to a form that can be used for future projects", 1, NULL);
    Add_Prize(100, "Teardown", "You are able dismantle and reclaim the components that went into the construction of any object, returning them to a state that can be used for future projects", 1, NULL);
    Add_Prize(100, "Salvage", "You are able to rapidly identify key components and how they are integrated into larger systems allowing you to add them to new systems without a loss in functionality", 1, NULL);
    Add_Prize(100, "Resourceful", "You are able to fine tune the composition of various materials used in the construction of various projects, either doubling effectiveness or halving the material cost.", 1, NULL);
    Add_Prize(100, "Efficient", "You use no more material than is actually needed. You are aware of the precise stress and strain concentrations, allowing you to optimise parts to the nth degree.", 1, NULL);
    Add_Prize(100, "Bespoke", "Whenever you make an object, you can choose to customise it for a specific person, adding structural and stylistic optimizations. In addition to working exceptionally well for that person, it will also last their entire life, should they take good care of it", 1, NULL);
    Add_Prize(100, "Refit", "You know how to upgrade things in such a way that their core essence remains. Regardless of how extensive the overhaul, people will recognise the object as the same thing and its core spirit will remain not only intact but empowered by the upgrades you made.", 1, NULL);
    Add_Prize(100, "Upgrades", "You know how to upgrade item. In fact, you are so good that the upgrades you make are just as good as if you had built the item with the new features in mind in the first place", 1, NULL);
    Add_Prize(100, "Standards", "You are able to build your systems such that they always remain compatible. Regardless of what changes as long as there is a level of commonality, your systems can integrate seamlessly", 1, NULL);
    Add_Prize(750, "The Raw Materials", "Your products are a cut above the rest. Using materials, you have produced allows your products to be twice as good in all aspects, compared to using even the best materials sourced elsewhere.", 1, NULL);
    Add_Prize(100, "Ranching", "Sometimes there just isn't a substitute for the real deal. Animal products have been a core material for all sorts of technologies and now you know how to supply it. You know just how to properly care for creatures of all kinds and gather replenishable materials in an ethical manner. And should it come time for slaughter you know how to do so quickly, without pain and without compromising the quality of the product.", 1, NULL);
    Add_Prize(100, "Farming", "That which formed the foundation of all civilization. That security in knowing that there would be food at the end of the day. You now know how to grow and manage plants of all kinds ensuring exemplary product.", 1, NULL);
    Add_Prize(100, "Mining", "Not merely the process of extracting minerals from natural deposits, but also the means of refining it into a useful state. You have a mastery of this art from planetary depths to the void of space.", 1, NULL);
    Add_Prize(100, "Forestry", "You understand what it means to sustainably manage a resource. You know how to manage intricate systems to ensure they are stable and improve their yield in respect to what you desire from the area.", 1, NULL);
    Add_Prize(100, "Bioculturing", "From fermentation tanks to cultured tissue, you know how to work with organic cells outside of a complex organism, whether that be cultivating them for some product or in order to produce specific tissues you have a deep understanding of how to overcome the challenges involved", 1, NULL);
    Add_Prize(100, "De-Extinction", "A seemingly impossible task. But given the slightest scraps of genetic material, you can replicate a complete viable genome and introduce enough variety to clone a breeding population.", 1, NULL);
    Add_Prize(100, "Terragenesis", "While the idea of terraforming is fantastic, it doesn't take into account the fundamental differences between planets. You know how to create stable ecosystems for any environment.", 1, NULL);
    Add_Prize(500, "Deep Insight", "The means of manufacture leaves its mark, a tell that you can unravel. You may not understand it, but the broad strokes or the procedure, if not the precise things involved can be gleaned with some investigation.", 1, NULL);
    Add_Prize(0, "Pure Industry", "You know how to overcome the challenges that would prevent you from operating at a grand scale. You know how to source or produce the precursors for any technology that you want to produce and how to deliver enough product to fulfil any project. Granted, those requirements may be beyond you.", 1, NULL);
    Add_Prize(200, "A jumble of wires and components", "You know how to design your work such that it is far more difficult to reverse engineer. In fact, it would be easier for most to try and recreate the observed effects than it would be to try and replicate the device itself.", 1, NULL);
    Add_Prize(200, "Industrial Design", "Sometimes, it just isn't enough to make things once. There's a special sort of skill that comes with designing things so that they can be made en-mass, and you now have it. You are now able to optimise designs for mass production, making the right compromises and trade-offs.", 1, NULL);
    Add_Prize(200, "Architect of Civilization", "From villages to archologies, you know how to create homes for people. These structures seem to anticipate the needs and desires of their residents", 1, NULL);
    Add_Prize(200, "Touch the Sky", "You know what it means to build big. The careful balance of tension, stress and strain that lets you build works unfathomable to those that came before.", 1, NULL);
    Add_Prize(200, "Megastructures", "What you do isn't mere architecture, no you work on a scale that few can even comprehend. From orbital rings to dyson spheres, you can work out the precise structures and material properties necessary to make it happen.", 1, NULL);
    Add_Prize(200, "Automotive", "from the simplest set of electric skateboards to the most complex trains, transport over land holds a certain set of challenges, from being able to make things move is an interesting challenge, and one that you now find easy enough to solve.", 1, NULL);
    Add_Prize(200, "Hydronautics", "Whether it is in the water or above it, traversing liquid environments pose particular challenges that you now find quite intuitive, both in terms of hydrodynamics and the chemical challenges of a fluid environment.", 1, NULL);
    Add_Prize(200, "Aeronautics", "Ah, the eternal dream of flight. Lift, drag... even the complex airflow of supersonic and hypersonic travel. There are numerous challenges to overcome as you take to the skies, but they are challenges that you laugh at now.", 1, NULL);
    Add_Prize(200, "Tunnelling", "Sometimes, all you need to do is dig a hole. But moving through the earth is not a particularly easy task. Without some sort of intangibility, you need to be able to deal with the solid matter surrounding you, but that isn't a problem for you anymore", 1, NULL);
    Add_Prize(200, "Cosmonautics", "Delta-V. The Rocket Equation. Even with exotic power sources and propulsion systems, space poses the incredible challenges of self-sufficiency and an incredibly hostile environment. Still dealing with the challenges of limited resources comes easily enough to you now", 1, NULL);
    Add_Prize(200, "Wearables", "From smart-watches to power armour, accommodating a user takes a particular set of skills and proficiencies, though that is no longer a problem for you. You can optimise technology for portability and comfort for long term use", 1, NULL);
    Add_Prize(200, "Handheld", "There is a great deal that goes into making technology that can be easily made use of, from ergonomics to portability. You find it easy to optimise technology in such a way that it is incredibly convenient to move around and use.", 1, NULL);
    Add_Prize(200, "Intuitive", "You have a way of designing systems that make them incredibly easy to learn how to use. Indeed, you could hand almost any one of your devices to a toddler and they could get it to do what it is supposed to do with relative certainty", 1, NULL);
    Add_Prize(100, "Signature Style", "You have a signature style, one that is utterly impossible not to recognize as yours and yet impossible to for someone else to replicate", 1, NULL);
    Add_Prize(50, "Do it in style", "Sometimes it isn't just a matter of getting things done, sometimes you need to look good doing it. You can incorporate design elements into your creations that allow them to fit into any aesthetic you can imagine or visualise. This will not alter its capabilities or functionality - for good or ill.", 1, NULL);
    Add_Prize(200, "It's Next Season Dahling", "You're a trend-setter, aren't you? You can produce designs that are not only beautiful, but are made in a way that people will want to imitate them.", 1, NULL);
    Add_Prize(200, "Monumental", "You can make big things. But that's not always enough. The things you make resonate with people, carving a message into their mind with the same permanence as a chisel in stone. From memorials to monuments your work isn't just beautiful, it sends a message.", 1, NULL);
    Add_Prize(200, "Understated", "You can hide the true power of your works. Indeed, it may not even appear technological, though that does not impair its functional whatsoever.", 1, NULL);
    Add_Prize(200, "Truly Awefull", "Your works can inspire a certain reverence in all those who gaze upon them. Be it devotion or despair, your works burn themselves into the hearts of witnesses.", 1, NULL);
    Add_Prize(200, "Any Sufficiently...", "You know how to make your technology look utterly fantastical... or your magic look entirely technical. To all but the most intense scrutiny, you can make your work resemble an entirely different paradigm", 1, NULL);
    Add_Prize(200, "Instant Classic", "Your works have a beauty that resonates through the ages. The things you make, they never really go out of style.", 1, NULL);
    Add_Prize(200, "Song of the Ages", "You can sing! In fact, you can sing amazingly well. Your voice and innate talent are such that this alone would make your performances almost hypnotic, capable of leaving lasting impressions that could affect a person in all the ways that powerful, emotional art can.", 1, NULL);
    Add_Prize(1000, "The Core Principle", "Should you encounter something you have never experienced before; you might have once been stumped. But with your understanding of existence, the minor details stand out to you. Perhaps not enough to replicate it, but enough to grasp the basics and work towards uncovering the core mechanisms that underlie what is being achieved", 1, NULL);
    Add_Prize(500, "Comeback Kid", "It might take a while, but you will surpass every challenger that comes your way. If anyone defeats you in a contest, your potential will grow beyond their skills and your growth will be accelerated. Of course, it might take a while to overcome truly titanic foes but it is inevitable, nonetheless inevitable that you will as long as you train hard and survive long enough", 1, NULL);
    Add_Prize(1000, "Nanomanipulators", "You know how to create macroscale objects that can generate effects on the nanoscale. These precise mechanisms allow you to manipulate individual atoms, and even parallelize operations across billions of instances allowing you to create notable amounts of nano-scale creations.", 1, NULL);
    Add_Prize(200, "Shop Tools", "From a simple welder to a six-axis milling machine, you know how to create a variety of tools for the manipulation of wood, metal, plastic and various other materials through the various means of subtractive manufacturing and joining.", 1, NULL);
    Add_Prize(200, "Quantum Lithography", "Specially prepared surfaces have any number of uses, from electronics to catalysts for any number of operations. And in most cases, smaller is better. You know how to create systems capable of creating controlled structures on the atomic scale, producing a delicate interplay of materials that can produce a multitude of effects and useful interactions.", 1, NULL);
    Add_Prize(100, "Computer Controls", "While you know how to operate your devices, and may have the skill and precision needed to perform even the most delicate operations, the cost of your time might simply be too great. Automating the various production steps might be initially time consuming but is almost always worth it.", 1, NULL);
    Add_Prize(200, "Precision Deposition", "From 3D printers to atomic fabricators, the processes underlying additive manufacturing require tools that can build up material into a variety of forms. You now know how to make a wide range of systems that would enable this style of manufacturing.", 1, NULL);
    Add_Prize(250, "Mystic Warrior", "Mages traditionally need protection. Between the time it takes to cast spells and the lack of physical training associated with the magical arts; it is rare that a mage forced into a physical confrontation can hold your own. But there are those who have trained themselves to cast quickly and hone their bodies in addition to their minds. You can not only handle yourself in a fight, the magic you can bring to one makes you a formidable foe", 1, NULL);
    Add_Prize(400, "Magitechnology", "You know how to meld the mystic and the mundane, seamlessly integrating magic into various other contraptions, allowing you to take advantage of arcane and technological principles in the manner that best addresses the situation at hand.", 1, NULL);
    Add_Prize(600, "Natural Language Interface", "This system takes advantage of a variety of tricks to allow for the transcription of simple natural language into a series of operations that can operate computer system. This interface can analyse the current state and make generally accurate action to produce the desired result.", 1, NULL);
    Add_Prize(100, "Clear Communication", "You have a way with words. You get your message across in a manner that it cannot be misunderstood, the very essence of your intent seemingly forced into the minds of those who listen. This also makes you an incredibly effective teacher as you can communicate complex topics in a manner that anyone can understand.", 1, NULL);
    Add_Prize(150, "Master's Qualification", "You have gained a level of education in a certain subject that would make you a master in that field. You even have the paper to prove it. You have a certificate that will be accepted by any relevant power that you have the relevant qualifications and it will pass any forms of validation check.", 255, NULL);
    Add_Prize(300, "Incredible Intellect", "Your mind is effectively unparalleled. By any metric you might just be the most intelligent person around. Your memory is edict and your logical process flawless. There are few, if any that  could come close to keeping up with you.", 1, NULL);
    Add_Prize(1000, "Prerequisites Met", "You have the base fundamental qualities necessary to gain or develop any non-unique skillset.", 1, NULL);
    Add_Prize(200, "Crafting Stations", "Regardless of how many people are technically required to operate any tool or piece of equipment, you find that you can fill the slots perfectly well.", 1, NULL);
    Add_Prize(1000, "10x", "You get shit done. It isn't just a matter of working ten times faster than someone else, your creations themselves work ten times faster, or ten times more efficiently if you so choose", 1, NULL);
    Add_Prize(100, "What Overtime?", "You get your work done. Your work faster than most, and find yourself rarely wanting for time. Where others may struggle to complete a task, you are able to complete it in short order. You complete work as though you had an extra hour for every hour you work, at the same quality you would have before.", 1, NULL);
    Add_Prize(200, "Battle Reflex Mode", "You gain an instinctive understanding of the ki technique known as Battle Reflex Mode. The name is something of a misnomer, as it focuses on the use of speed to improve mental processing speeds and augment your body well enough to keep up with it. The extent to which you can accelerate yourself, and for how long is dependent on your reserves and control, but at a base, you could double your speed for an hour, or make yourself five times faster for a minute", 1, NULL);
    Add_Prize(300, "Crunch Time", "You can push yourself further than most. Through grit and determination, you can get triple the work done than you could have otherwise", 1, NULL);
    Add_Prize(100, "Sleight of Hand", "You get things done faster than most people could even see you work. Indeed, it seems like for everything you do another thing is already done, halving the time it takes for you to finish your work. You're also really good with magic tricks", 1, NULL);
    Add_Prize(300, "Oh How The Time Flies", "Time just passes differently when you are working, doesn't it? While you are focused on a project, time seems to flow five times faster both for you and your work", 1, NULL);
    Add_Prize(200, "In all my years", "You work with the skill and efficiency of a seasoned professional. You can diagnose problems with the slightest sound or smell - all it takes is the slightest hint - and you complete your work with no chance of error. All those little things add up, quartering the time it would take for you to get your work done", 1, NULL);
    Add_Prize(400, "Me and me and me and me", "You can work as four people. Quite literally, you can separate yourself into four identical bodies with a shared mind, allowing you to tackle bigger projects.", 1, NULL);
    Add_Prize(500, "Something to remember you by", "Sometimes you meet an exceptional individual, a fundamental facet of reality. Should you form a bond with those entangled with faith, you can call upon a morsel of their power. Perhaps not the full strength of their power but something iconic nonetheless.", 1, NULL);
    Add_Prize(0, "Breathing Room", "When you win a Prize, the world seems to slow to a halt for a few moments, letting you consider the impact of your decisions. You might be unable to move but for a few minutes, you are safe to focus your full attention to your new acquisition.", 1, NULL);
    Add_Prize(1000, "Supplies", "For any material you could have infinite access to, you now simply do. You gain a supply of every material that you have access to that grows in quantity as though you were constantly working to grow it through your various powers", 1, NULL);
    Add_Prize(300, "Batch Job", "The tedium of making a single part over and over again is often something that crafters need to get used to. But not you. You can choose to have four extra instances of the same item be created when making one", 1, NULL);
    Add_Prize(500, "Production Run", "Sometimes you just need more than one of something. In this case, you may choose to produce 12 additional instances of the same item when making one", 1, NULL);
    Add_Prize(1000, "Mass Production", "Outfitting an army is a challenge of logistics and time. While this won't help with the logistics, you can choose to have an additional 99 instances of an item you create be produced when you create one.", 1, NULL);
    Add_Prize(500, "Make it Bigger", "There are challenges that come with working on a larger scale. The square cube law is a bitch ain't it. But you know how to get around that. How to push materials to their limits through careful design.", 1, NULL);
    Add_Prize(500, "Scale Model", "Isn't that train just perfect? You could almost see it riding real tracks. Actually, you could. At your command, upon completion objects will grow to 22.5 times their original size in every dimension", 1, NULL);
    Add_Prize(500, "Make it Fit", "Sometimes it's hard to squeeze everything you need into a tight space. But you know the tricks, having various parts pull double, triple or even quadruple duty in order to squeeze in far more than you normally could", 1, NULL);
    Add_Prize(500, "Honey, I shrunk the things", "Sometimes, you just need to keep things compact. At your command, you can shrink things to 1/22.5 of their original size in every dimension upon completion.", 1, NULL);
    Add_Prize(500, "Nanoscopic Vision", "Your senses can operate on a scale far below the notice of any human. With a moment's focus your eyes can pick out individual organelles and even note the molecular machinery that makes it function. The rest of your senses are similarly enhanced.", 1, NULL);
    Add_Prize(750, "Metatool", "As your skills grow, you keep finding tools that become integral to your work. From oscilloscopes to gravity wrenches to nano-manipulators your kit grows larger and more unwieldy as your capabilities grow. This tool can absorb any tool into itself and transform into them whenever necessary", 1, NULL);
    Add_Prize(50, "Tiny Raccoon-like Fingers", "You can get into all of those small hard to reach places and easily manipulate tiny parts. Your dextrous fingers manipulate objects with an ease and precision that would suggest that they are five times the size they would otherwise be", 1, NULL);
    Add_Prize(200, "Fractal Fingers", "Well, not just fingers. Your hands are now capable of limited shapeshifting, allowing you to manifest relatively simple tools. Nothing capable of any advanced logic, but everything from a hammer to a voltmeter are at your fingertips", 1, NULL);
    Add_Prize(300, "Warrantee", "When made in a workspace that you own, you may choose to imbue objects with a degree of self-repair. The devices made this way will repair themselves in at most 168 hours, less if the parts are in proximity. Any parts that are inaccessible will relocated piecemeal whenever they are unobserved, and will end up in increasingly unlikely scenarios to become unobserved as the deadline approaches.", 1, NULL);
    Add_Prize(100, "Maker's Mark", "You now have a mark, and emblem born of your very self that now exists on anything you make. This mark is unforgeable and allows you to know where the object is whenever you desire.", 1, NULL);
    Add_Prize(1000, "Conversion", "All of these different energies can get confusing. Well, no more. Your power has grown to the point that the differences between things like magic and ki are subsumed under your power. All supernatural energies are the same to you.", 1, NULL);
    Add_Prize(200, "Life Energy", "You know how to distil pure life energy from living things of all kinds, though more complex and longer-lived life forms tend to be richer in the stuff. In base form this is already a potent restorative, improving healing and fighting off the general maladies of old age for a while.", 1, NULL);
    Add_Prize(1000, "Aether", "This primordial stuff is not matter in truth. In many ways, this could be said to be purified untainted 'existence'. It is in this substance that the laws of the universe are written", 1, NULL);
    Add_Prize(1000, "The Maw", "This is the ultimate fate of all things. When the clock spring of the universe is spent, this is all that remains. And as everything must become it, you know how to turn anything into it.", 1, NULL);
    Add_Prize(1200, "Quantum Nanobots", "In your mind exists the designs for a great and terrible things. A class of automata that exist beyond the base definition of nano-bots. These are less physical constructs and more carefully altered segments of the very fabric of reality that can be commanded to alter matter on a subatomic scale.", 1, NULL);
    Add_Prize(200, "Distilled Darkness", "You know how to condense the void of darkness into a… form you can manipulate. Something like a supercritical fluid this substance can be used for a variety of purposes, but the simplest will consume light that touches it.", 1, NULL);
    Add_Prize(200, "Liquid Light", "You can precipitate photons into a concentrated fluid-like substance. Though this has many uses, the simplest is to let it evaporate into light, which it does relative to its surface area.", 1, NULL);
    Add_Prize(200, "Spacetime Fabric", "You have a method of extracting segments of the very fabric of space and time, allowing you to render them down into two-dimensional representations you can easily manipulate. When this process is reverted, it reintegrates into the universe, causing intense gravitational waves unless it takes the shape of some stable structure.", 1, NULL);
    Add_Prize(200, "Potion of Spiritual Form", "Most souls require a physical form to resist the natural spiritual flows of their universe and remain 'alive' but there are ways around that. You can brew a potion that maintains your physical body and grants your soul the ability to wander freely for a time in a sort of ghostly state", 1, NULL);
    Add_Prize(1000, "Cosmic Conveyance Core", "You know how to create a device, that when built into a spacefaring vessel and provided enough power can allow it to travel through a realm at impossible speeds. Indeed, this system can allow a craft to traverse the observable universe in but a single century.", 1, NULL);
    Add_Prize(1200, "Oracle Machine", "You know how to grant a machine the gift of foresight. The effects of this are limited, only allowing them to detect their own future state, but that is itself immensely useful. This allows a device to massively accelerate its operation by getting the result of an action before it even happens.", 1, NULL);
    Add_Prize(750, "Temporal Substitution Translocation Array", "Through a complex combination of various technologies, you can swap the body of an individual that died with a mindless clone. As you would need to account for temporal effects, this substitute body is required. The device thus effectively 'resurrects' those who have died, whisking themselves at their very last moments.", 1, NULL);
    Add_Prize(500, "Simulation Space", "Through a combination of magic, alchemy and technology you are able to create a sort of programmable room, which can replicate any environment and even simulate the presence of others.", 1, NULL);
    Add_Prize(200, "Adaptive Environmental Shell", "The AES is what happens when form and function meet. Through various means, this shell can replicate any outfit, and seamlessly modify them in order to provide the coverage and protection needed in order to survive any environment. ", 1, NULL);
    Add_Prize(300, "Universal Translation Devices", "These devices make use of psionic principles to facilitate communication without any chance of misrepresentation . This system works in real time, translating even parts of the sentence that haven't been said yet.", 1, NULL);
    Add_Prize(500, "Full Body Prosthesis", "This set of cybernetics is everything needed to replace every last cell of the body with an engineered replacement. Even the brain can be converted (through the use of nano-bots in order to improve function.", 1, NULL);
    Add_Prize(100, "Certified Confidential", "This system was developed… somewhere in order to allow for secret agreements that need to be made. Through the use of various psionic markers this beacon can destroy all memories made within a certain distance of it while it was active utterly irreparably. ", 1, NULL);
    Add_Prize(200, "Adaptive All Purpose Tool", "The AAPT system is an easily portable set of high-detail force-field generators, hologram projectors, sensors and additive manufacturing tools that can replicate a wide range of hand tools and perform on-site temporary repairs for a wide range of common problems.", 1, NULL);
    Add_Prize(300, "Complete Immersion Simulation System", "The Complete Immersion Simulation System is a form of complete sensory replacement device that allows a user to interface with virtual environments. The designs you have are flexible enough to be adapted to pretty much any body type.", 1, NULL);
    Add_Prize(750, "Event Proxy Analysis Recorder", "This is not so much a sensor as it is an 'echo' of an extant event. The records it makes, when analysed by any form of study, generate results identical to if you had examined the effect directly. However, due to the nature of the recordings, the recorders are limited to events that occurred within a few hundred meters.", 1, NULL);
    Add_Prize(300, "Preservation Pods", "These containers effectively stop time for anything stored within them. Just… remember to label them, the field turns the  outside surface of the preserved volume into a perfect mirror, so figuring out what is inside can get a bit tricky.", 1, NULL);
    Add_Prize(100, "Assistive Drone", "This autonomous platform has a surprisingly high-detail force-projection system and a reactionless drive highly optimised for its size. Paired with the on-board computing resources it makes the perfect helper-bot. By default, it comes with a simple verbal interface that can have it move and carry various objects though it isn't very smart.", 1, NULL);
    Add_Prize(200, "Familiar", "You know how to form a magical and spiritual link with a creature, granting it a portion of your power while allowing it to act as a focus for the rest of yours. You can even facilitate this process for others, though it always must be accepted by both parties.", 1, NULL);
    Add_Prize(500, "Inner World", "You have the designs for an artificial demiplane, a limited volume of space that acts as though it was its own universe. The exact design is somewhat random, but is themed based on various workspaces and environments.", 255, NULL);
    Add_Prize(200, "Subtle Instruments", "There is a time for grandstanding, and there is a time for subtlety. From multi-stage poisons to subtle suveilance devices, you know how to create tools that enables covert action of all kinds.", 1, Table_Resolver(181));
    Add_Prize(100, "Engineer", "You know the limits of the physical world, and are able to leverage them in such a way as to handle the forces and stresses needed to complete a job. Indeed, your only limitations are the resources you have available to you.", 1, NULL);
    Add_Prize(100, "Chemist", "Be it electrolytes or solvents, adheisives or sealants, it takes a great deal of skill to work with the chemical properties of substances of all kinds. You are bestowed with a deep understanding of how to produce and leverage complex chemical compounds and coctails for all sorts of applications.", 1, NULL);
    Add_Prize(100, "Materials Science", "You know how to engineer substances with distinct physical properties, allowing you to create materials that serve the purpose you intend effectively.", 1, Table_Resolver(314));
    Add_Prize(100, "Hyper Capacitors", "You know how to make systems capable of storing up large amounts of energy and releasing it at practically any rate demanded of them.", 1, Table_Resolver(315));
    Add_Prize(100, "Power Vault", "You know how to create systems capable of storing vast amounts of energy for long periods of time. These systems scale incredbly well and can handle extended power draw, providing a steady supply of power for almost any purpose.", 1, Table_Resolver(315));
    Add_Prize(250, "Emergency Defense", "Sometimes, you simply don't have a weapon on hand. Whether it is because you were captured or simply thought you were safe, there comes a time to use what you have available to you. Only that isn't a problem. You know how to use practically anything to its full effect in combat.", 1, NULL);
    Add_Prize(400, "Circles and Cycles", "Cyclic motion, a core facet of how the very universe functions. Your understanding of this grants a great deal of insight into the generation and effects of oscillations and vibrations of all kinds", 1, NULL);
    Add_Prize(300, "Waves", "It is odd, how many different phenomena propagate as waves, from light to sound to gravity itself. You have gained an insight into these phenomena that allows you to generate and predict such events with ease", 1, Table_Resolver(319));
    Add_Prize(500,"Sap of the World Tree","This amber-like substance is a stable, solid form of spiritual energy. Far more dense than Ichor, though perhaps slightly harder to work with, it is nonetheless incredibly valuable to those who know what it is. You know how to make it from and sublimate it back into spiritual energy",1,Table_Resolver(0));
    Add_Prize(200,"Phantom Limbs","You know how to integrate technology in a way that connects to a host soul and perhaps even combine with it given enough time. To use them is natural, as though they were always part of the user",1,Table_Resolver(0));
    Add_Prize(200,"Self-Evident","You can grant your creations and aura of sorts, a presence that is undeniable even by the staunchest non-believer. It marks your creations as important and valuable, perhaps if only as a representation of something greater",1,Table_Resolver(1));
    Add_Prize(200,"Programmed Action","You know how to generate… intent. This allows you to command a body through a mind you have access to, causing it to undertake a sequence of actions precisely as you intend with no input from the host mind.",1,Table_Resolver(22));
    Add_Prize(200,"Shared Dreaming","There are ways to build on emotional connections, reinforce them through psionic means. For those that have strong enough bonds to provide sufficient foundation, you can link the subconscious minds of two people, allowing them to share dreams. For those who can lucid dream, this becomes an avenue of communication that is unbound by distance",1,Table_Resolver(22));
    Add_Prize(200,"Gifted Student","You can pick up anything with only a little instruction. In fact, you are practically a sponge. Though this works best with martial techniques, your ability extends to any educational endeavour",1,NULL);
    Add_Prize(200,"Like a Steel Trap","You have a mind well suited to alchemy. Not only can you hold incredibly complex alchemical processes in your mind with ease, you can also perfectly memorise and visualise complex structures perfectly with but a single glance",1,NULL);
    Add_Prize(300,"Mystic Triggers","You know how to set up magical effects so that they will trigger when they receive the appropriate stimulus. What that stimulus is? Up to you! The actual techniques place no particular importance on what they might be.",1,Table_Resolver(83));
    Add_Prize(250,"Elemental Affinity","Magic might be Effect; your will be enforced upon the world. But some things are easier than others. You have found that there is a certain class of effect that is easier to bring about, though this may fall under a traditional 'element' in some schools, in truth the element depends heavily on the individual in question. You gain a new element each time you receive this prize",255,Table_Resolver(84));
    Add_Prize(250,"Unknowable","You can implement principles in your technology that mortal minds cannot hope to process. Attempts to reverse engineer technology using these principles will drive those who attempt to do so mad",1,Table_Resolver(104));
    Add_Prize(500,"High Energy Physics","You have gained a deep insight into interesting high-energy phenomenon, and how they interact with the subtle differences between different cosmologies. This allows you to adapt and make the requisite substitutions to allows complex technologies to work across different laws of physics",1,NULL);
    Add_Prize(200,"Actuators","You know how to turn power into motion. From motors to linear actuators, you have a knack for turning any source of energy into forces that can be applied to the rest of the world",1,NULL);
    Add_Prize(150,"Plasma logic","You know how to take advantage of subatomic particles to perform logical operations. From vacuum tubes to ion-channels you know how to make use of high-energy physics to perform computation. Though power-hungry, this form of computation excels at rapid analog operations.",1,NULL);
    Add_Prize(200,"Plasma Manipulation","Working in High-Energy regimes is difficult. Your substrate is quarrelsome and has the power necessary to fight back. Still, you know how to effectively shape and direct plasmas and ion streams of all kinds, enabling you to take advantage of the unique properties of these substances",1,NULL);
    Add_Prize(200,"Thermodynamics","Heat, both prized and dreaded. A necessity in some situations, a bane in others. You have a deep understanding of this phenomenon and how you can effectively manipulate it, concentrating it, dispersing it or simply transporting it from one place to another",1,NULL);
    Add_Prize(200,"Biointegration","You know how to work with biological systems, creating technology that will easily interface with it. From simple replacement bones to complex cybernetic augmentations that grant entirely new senses - you are more limited by the rest of the system than any integration issues",1,NULL);
    Add_Prize(200,"Modular","It is difficult to create the perfect set of capabilities for every situation, the sheer variety of necessary functionalities hindering the overall efficacy of any solution. As such, you need to be able to tailor your options to the scenario at hand. You have a knack for designing systems in such a way that they will be able to act in concert without any loss in overall capability due to their modular nature",1,NULL);
    Add_Prize(200,"Multi-mode","The overall structure of any particular object can affect it's functionality, improving and limiting its ability to operate in different environments and situations. However, while this cannot be overcome, it can be… bypassed. You know how to create systems that will reshape objects, allowing them to take on several different forms, better suited to different purposes without hindering their capabilities in other situations",1,NULL);
    Add_Prize(350,"Logistics","Though they may not be truly physical, the greatest challenges will always be logistical. Simply moving large amounts of stuff from one place to another requires understanding the resources available to you and how to best deploy them. You have a particular knack for this, not only in using extant systems, but how new factors will affect these systems and where the greatest roadblocks are",1,NULL);
    Add_Prize(200,"The Little Things","Sometimes simply paying attention to the everyday wonders is all it takes to uncover a hidden world. You are quite observant, and have a good head for causality. With a little focus you know what the major contributors to any specific outcome are, and have a good idea how they work",1,NULL);
    Add_Prize(200,"The Latest and Greatest","You always learn from your mistakes, even if they might seem minor. Whenever you make something, it is better than any previous example given the same time and resources. Whether that means being made faster, or being better at its job depends on your personal goals",1,NULL);
    Add_Prize(200,"Mega-Machines","There's only so much power you can pack into a certain amount of space, but at the same time, working on such large scales can get incredibly difficult. You now have a head for such things able to scale up the size - and thus effects - of your creations as far as you wish",1,NULL);
    Add_Prize(200,"Mini-Machines","There's something to be said about subtlety. Brute force isn't always the solution to every problem, and often times you simply don't want to make a mess. This allows you to scale down your creations, replicating the same functionality at smaller scales",1,NULL);
    Add_Prize(350,"Lucky Break","Research often depends on that one chance encounter. Sometimes it's a mistake, sometimes it is simply catching sight of a rare phenomenon. But that seems to happen more often than you. Odd, unlikely events just seem to happen when you are watching.",1,NULL);
    Add_Prize(400,"Spatial Bounce-back Propagators","You know how to create systems that can transmit packets of space at a faster-than-light speed and 'bounce back' after reaching a specific range. This allows signals and various events to operate at a range, allowing you to 'propagate' the effect of sensors at FTL speeds",1,NULL);
    Add_Prize(200,"FTL Deep Space Telemetry","You know how to create devices that take advantage of hyper-planer properties to gather data about the structure of space-time faster than the speed of light. Detecting curvature that would produce an acceleration greater than 0.01Gs is possible out to ten lightyears",1,NULL);
    Add_Prize(300,"Interstellar Transceiver","These devices transmit a signal through farspace and can capture similar ones, allowing omnidirectional communication at trillions of times the speed of light. You have designs capable of handling the power necessary to broadcast over ranges that begin at interstellar and reaching up to the local group, the propagation rate multiplying over the speed of light a thousand times at each level",1,NULL);
    Add_Prize(25,"Precision Clocks","These clocks take advantage of precise quantum phenomenon that allow them to measure the local progress of time on a Planck scale. You can create these systems, allowing you to track how long has passed since their creation to whatever extent is physically possible.",1,NULL);
    Add_Prize(150,"Inertial Unifiers","You know how to create devices that can project a field which transmits force throughout its volume in such a way that results in uniform acceleration. You have designs that scale from a few kilonewtons to the forces needed to propel spaceships at incredible speeds",1,NULL);
    Add_Prize(250,"Farspace Transit Window Generator","This series of devices allows objects to transition in and out of Farspace, allowing them to travel across realspace at faster-than-light speeds. You have the designs for a range of such devices, from small units suitable for courier drones to massive systems intended for use in colony-ships",1,NULL);

    // Core Perks start at 428

    return 0;
}
