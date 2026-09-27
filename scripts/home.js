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
        card.classList.remove('show-side', 'show-center');

        if (index === currentIndex) {
            card.classList.add('show-center');
            card.style.order = 1;
        } else if (index === prevIndex) {
            card.classList.add('show-side');
            card.style.order = 0;
        } else if (index === nextIndex) {
            card.classList.add('show-side');
            card.style.order = 2;
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}
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
    Wist: {
        author: "Wist",
        title: "Zarah",
        desc: "Thank you to our dear customers and supporters for trusting our product!"
    },
    FuzzyDreams: {
        author: "FuzzyDreams",
        title: "Butterfly Lamp",
        desc: "I love my lamp"
    },
    HeartFeltCraftsByAngie: {
        author: "HeartFeltCraftsByAngie",
        title: "Keychain",
        desc: "Hooray I am so excited making a business soon"
    }
};

const Flasher = document.getElementById('TheFlasher');
const Stalker = document.getElementById('Stalker');
const CheckView = document.getElementById('CheckView');
const ATitle = document.getElementById('ATitle');
const ADesc = document.getElementById('ADesc');
const Owner = document.getElementById('Owner');
const PROFILE_PAGE = 'artistprofile.html';

/* Usernames load once so the popup link never waits on a fetch */
const profileNames = new Map();

Account.all().then(accounts => {
    accounts.forEach(account => profileNames.set(account.username.toLowerCase(), account.username));
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

document.querySelectorAll('.Cathy img, .Mark img').forEach(img => {
    img.addEventListener('click', () => {
        const info = artworks[img.dataset.id];
        if (!info) return;

        Stalker.src = img.src;
        CheckView.textContent = info.author;
        ATitle.textContent = info.title;
        ADesc.textContent = info.desc;
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

