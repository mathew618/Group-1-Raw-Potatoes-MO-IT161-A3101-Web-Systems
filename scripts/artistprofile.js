const BANNER_FALLBACK = Artist.ASSETS + Artist.BANNER;
const viewer = new GalleryViewer();

function showArtistSection(section) {
    const isPortfolio = section === 'portfolio';

    document.getElementById('ArtistPortfolio').style.display = isPortfolio ? 'block' : 'none';
    document.getElementById('ArtistCommissions').style.display = isPortfolio ? 'none' : 'block';
    document.getElementById('button4Portfolio').classList.toggle('active', isPortfolio);
    document.getElementById('button4Commission').classList.toggle('active', !isPortfolio);
}

function renderArtistProfile(artist) {
    document.getElementById('ArtistUsername').textContent = artist.username;
    document.getElementById('ArtistBio').textContent = artist.bio || Account.DEFAULT_BIO;
    document.getElementById('ArtistArtworkCount').textContent = artist.artworks.length;
    document.getElementById('ArtistCommissionCount').textContent = artist.packages.length;

    showImage(document.getElementById('ArtistBanner'), artist.banner, BANNER_FALLBACK);
    showImage(document.getElementById('ArtistAvatar'), artist.avatar);

    renderGalleryCards(document.getElementById('ArtistPortfolioPicnic'), artist.artworks,
        item => viewer.open(item), { empty: 'ArtistPortfolioEmpty' });

    renderGalleryCards(document.getElementById('ArtistCommissionPicnic'), artist.packages,
        item => viewer.open(item, true), { empty: 'ArtistCommissionEmpty' });

    showArtistSection('portfolio');
    document.getElementById('ArtistProfile').style.display = 'block';
}

function showMissingProfile(name) {
    document.getElementById('ArtistMissingText').textContent = name
        ? `${name} hasn't set up a profile yet.`
        : 'No artist was selected.';
    document.getElementById('ArtistMissing').style.display = 'block';
}

async function loadArtistProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const id = params.get('id');

    try {
        const artist = username ? await Account.byUsername(username) : await Account.byId(id);

        if (artist instanceof Artist) {
            renderArtistProfile(artist);
        } else {
            showMissingProfile(username || id);
        }
    } catch (error) {
        showMissingProfile(username || id);
    }
}

Account.protectPage(loadArtistProfile);
