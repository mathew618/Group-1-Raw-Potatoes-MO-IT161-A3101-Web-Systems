Account.protectPage();

/*This is Dots4Hotdogs*/
let currentIndex = 2;
const gambit = document.querySelectorAll('.ArtsyBitsy > div');
const endoftheworld = gambit.length;
const dotts4hotdogs = document.getElementById('buttonlock');

gambit.forEach((card, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.addEventListener('click', () => {
        currentIndex = index;
        updateSlides();
    });
    dotts4hotdogs.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

function updateSlides() {
    const prevIndex = (currentIndex - 1 + endoftheworld) % endoftheworld;
    const nextIndex = (currentIndex + 1) % endoftheworld;

    gambit.forEach((card, index) => {
        card.classList.remove('show-left', 'show-center', 'show-right');

        if (index === currentIndex) {
            card.classList.add('show-center');
        } else if (index === prevIndex) {
            card.classList.add('show-left');
        } else if (index === nextIndex) {
            card.classList.add('show-right');
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

requestAnimationFrame(() => {
    document.getElementById('SunsetParadise').classList.add('carousel-ready');
});

function changeFeatured(direction) {
    currentIndex = (currentIndex + direction + endoftheworld) % endoftheworld;
    updateSlides();
}

updateSlides();
/*This is Previewing the Arts*/
const artworks = {
    Camryngamesyt: {
        author: "Camryngamesyt",
        title: "Candle Painting",
        desc: "A candle loses nothing by lighting another candle. - James Keller."
    },
    Maboroshiiiro: {
        author: "Maboroshiiiro",
        title: "Matchlight 🖌🌙",
        desc: "an old fave of mine hope you like it ♡ #digitalpainting"
    },
    Superbunny64: {
        author: "Superbunny64",
        title: "Goobert's painting",
        desc: "#inscryption"
    },
    FanFive: {
        author: "FanFive",
        title: "Pixel Hamburger",
        desc: "Is this a sandwich? Commission Us Now!",
    },
    Piggy: {
        author: "Piggy",
        title: "Bakugo MHA",
        desc: "Bakugo is the very embodiment of pride and self-cneteredness"
    },
    Demonized_Louie: {
        author: "Demonized_Louie",
        title: "Simple Sketch",
        desc: "I Love Drawing"
    },
    Crocheana: {
        author: "Crocheana",
        title: "Crochet Naruto",
        desc: "narutoo will go home naa🥹🧡 Mas mahirap i-wrap kesa icrochet HAHAHAHAHAHA"
    },
    Moon_Bow_Coser: {
        author: "Moon Bow Coser",
        title: "Drawing for my BBG Sun Raye mwamwa",
        desc: "Haii guys I draw <333 Ill probably post an artist intro once I actually have a decent amount of drawings ><<<"
    },
    FuzzyDreams: {
        author: "FuzzyDreams",
        title: "Butterfly Lamp",
        desc: "I love my lamp"
    },
    HeartFeltCraftsByAngie: {
        author: "HeartFeltCraftsByAngie",
        title: "KeyChains for Sale",
        desc: "Hooray I am so excited making a business soon"
    },
    notgracelive: {
        author: "notgracelive",
        title: "Baroque Painting",
        desc: "Part 1 of making every Minecraft painting in real life!!"
    },
    TylorHepnerArt: {
        author: "TylorHepnerArt",
        title: "Leon Resident Evil 4 Remake",
        desc: "My New Leon Painting to celebrate RE4 Remakes release!"
    },
    tatianarodrigues24: {
        author: "tatianarodrigues24",
        title: "Clove (valorant) painting 🦋",
        desc: "Hand painted with matte acrylic paint."
    },
    Piethatrot: {
        author: "Piethatrot",
        title: "BRUH",
        desc: "BRUHHHHHHH"
    },
    Liciou: {
        author: "Liciou",
        title: "Sunset with your Partner",
        desc: "My darling someday we will watch the sunset together, and I will hold your hand and never let go."
    },
    Bee_Bianca: {
        author: "Bee_Bianca",
        title: "Sketch",
        desc: "Random Sketch"
    },
    Synesthria: {
        author: "Synesthria",
        title: "Lucky To Be Here",
        desc: "SHS 1"
    },
    Lazenko: {
        author: "Lazenko",
        title: "Candy Corn Earrings",
        desc: "Random Stuff"
    },
    edgichel: {
        author: "edgichel",
        title: "BABYYY IM BORRED",
        desc: "#art #digitalart #procreate #artistsoninstagram #fanart #laufey #junia #artoninstagram #drawing #illustration #design"
    },
    Alina: {
        author: "Alina",
        title: "⋆. 𐙚 ̊🍋‍🟩♪⋆.✮ ",
        desc: "I remember being afraid to colour this piece because I didn’t want to mess up the sketch 😭 Btw you can use code: ALINAAZAC for 10% off on the Ohuhu website ✨ #ohuhumarkers #markerart #sketchbook #sketching #alcoholmarkers"
    }
};

const Flasher = document.getElementById('TheFlasher');
const Stalker = document.getElementById('Stalker');
const DetailAvatar = document.getElementById('DetailAvatar');
const CheckView = document.getElementById('CheckView');
const ATitle = document.getElementById('ATitle');
const ADesc = document.getElementById('ADesc');
const Owner = document.getElementById('Owner');
const PROFILE_PAGE = 'profile.html';
DetailAvatar.src = Artist.ASSETS + Artist.AVATAR;

/* Usernames load once so the popup link never waits on a fetch */
const profileNames = new Map();

Account.all().then(accounts => {
    accounts.forEach(account => profileNames.set(account.username.toLowerCase(), account.username));
});

document.querySelectorAll('.ArtsyBitsy p').forEach(name => {
    name.classList.add('ClickyPicky');

    name.addEventListener('click', () => {
        const username = profileNames.get(name.textContent.trim().toLowerCase());

        if (!username) {
            alert('No profile yet.');
            return;
        }
        window.location.href = `${PROFILE_PAGE}?user=${encodeURIComponent(username)}`;
    });
});
function linkProfile(identifier) {
    const username = profileNames.get(identifier.toLowerCase());

    CheckView.classList.toggle('clickable', Boolean(username));
    Owner.textContent = username ? '' : 'No profile yet.';

    if (username) {
        CheckView.href = `${PROFILE_PAGE}?user=${encodeURIComponent(username)}`;
    } else {
        CheckView.removeAttribute('href');
    }
}

document.querySelectorAll('.Cathy img, .Mark img, .Ridel img, .Rubio img').forEach(img => {
    img.addEventListener('click', () => {
        const info = artworks[img.dataset.id];
        if (!info) return;

        Stalker.src = img.src;
        CheckView.textContent = info.author;
        ATitle.textContent = info.title;
        ADesc.textContent = info.desc;

        Account.byUsername(img.dataset.id).then(account => {
            const avatar = (account && account instanceof Artist) ? account.avatar : Artist.ASSETS + Artist.AVATAR;
            DetailAvatar.src = avatar || (Artist.ASSETS + Artist.AVATAR);
        });

        linkProfile(img.dataset.id);
        Flasher.classList.add('open');
    });
});

function closeFlasher() {
    Flasher.classList.remove('open');
}

document.getElementById('GotSnapped').addEventListener('click', closeFlasher);

Flasher.addEventListener('click', (e) => {
    if (e.target === Flasher) closeFlasher();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFlasher();
});
