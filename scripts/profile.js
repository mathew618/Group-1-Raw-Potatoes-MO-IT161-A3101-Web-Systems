/* Account profile system (data/accounts.json) */
const viewer = new GalleryViewer();

const PANELS = {
    portfolio: { panel: 'ProfilePortfolio', tab: 'button4Portfolio' },
    commission: { panel: 'ProfileCommissions', tab: 'button4Commission' },
    dashboard: { panel: 'ProfileDashboard', tab: 'button4Dashboard' }
};

const BANNER_FALLBACK = Artist.ASSETS + Artist.BANNER;
const MAX_UPLOAD_BYTES = 1024 * 1024;

/* Global keys from the old profile page */
const LEGACY_GALLERY_KEYS = ['artifyph_portfolio', 'artifyph_commission'];

let profile = null;
let isOwner = false;
let editMode = false;
let editingIndex = null;
let selectedCommissionIndex = null;
let pendingPortfolioImage = null;
let pendingCommissionImage = null;

function showSection(section) {
    Object.entries(PANELS).forEach(([name, { panel, tab }]) => {
        document.getElementById(panel).style.display = name === section ? 'block' : 'none';
        document.getElementById(tab).classList.toggle('active', name === section);
    });
}

/* Owner only: edit mode, add form and saving */
function toggleEditMode() {
    editMode = !editMode;
    document.getElementById('ButtonWobblyGoopler').textContent = editMode ? 'Done' : 'Edit';
    renderGalleries();
}

function openAddForm() {
    if (!isOwner) return;

    editingIndex = null;

    if (document.getElementById('button4Portfolio').classList.contains('active')) {
        resetPortfolioForm();
        toggleForm('Subnautica', true);
    } else {
        resetCommissionForm();
        toggleForm('Minecraft', true);
    }
}

function openEditForm(type, index) {
    if (!isOwner) return;

    editingIndex = index;

    if (type === 'portfolio') {
        const item = profile.portfolio[index];
        if (!item) return;

        document.getElementById('PTitle').value = item.ptitle || '';
        document.getElementById('PDesc').value = item.pdesc || '';
        pendingPortfolioImage = null;
        setFormImage('PPreviewPhoto', 'ImNotSureYetPhoto', profile.artworks[index].image);
        toggleForm('Subnautica', true);
    } else {
        const item = profile.commissions[index];
        if (!item) return;

        document.getElementById('CTitle').value = item.ctitle || '';
        document.getElementById('CDesc').value = item.cdesc || '';
        pendingCommissionImage = null;
        setFormImage('CPreviewPhoto', 'NeitherThisOne', profile.packages[index].image);
        setStatusButton(item.status);
        toggleForm('Minecraft', true);
    }
}

async function savePortfolioItem() {
    if (!isOwner) return;

    if (!document.getElementById('PPreviewPhoto').classList.contains('has-image')) {
        alert('Please upload a photo first.');
        return;
    }

    const existing = editingIndex === null ? null : profile.portfolio[editingIndex];
    const item = {
        partist: profile.username,
        ptitle: document.getElementById('PTitle').value,
        pdesc: document.getElementById('PDesc').value,
        image: pendingPortfolioImage || (existing ? existing.image : '')
    };

    if (!(await storeItem(profile.portfolio, editingIndex, item))) return;

    cancelPortfolioForm();
    renderGalleries();
}

async function saveCommissionItem() {
    if (!isOwner) return;

    if (!document.getElementById('CPreviewPhoto').classList.contains('has-image')) {
        alert('Please upload a photo first.');
        return;
    }

    const existing = editingIndex === null ? null : profile.commissions[editingIndex];
    const item = {
        cartist: profile.username,
        ctitle: document.getElementById('CTitle').value,
        cdesc: document.getElementById('CDesc').value,
        status: document.getElementById('CStatusButton').classList.contains('statusOpen') ? 'open' : 'closed',
        image: pendingCommissionImage || (existing ? existing.image : '')
    };

    if (!(await storeItem(profile.commissions, editingIndex, item))) return;

    cancelCommissionForm();
    renderGalleries();
}

/* Adds or replaces an item, then rolls back when the save fails */
async function storeItem(list, index, item) {
    const existing = index === null ? null : list[index];

    if (index === null) {
        list.push(item);
    } else {
        list[index] = item;
    }

    if (await persistProfile()) return true;

    if (index === null) {
        list.pop();
    } else {
        list[index] = existing;
    }
    return false;
}

async function persistProfile() {
    try {
        await profile.save();
        return true;
    } catch (error) {
        alert('Could not save your changes - browser storage is full.');
        return false;
    }
}
/* Forms, commission status and uploaded images */
function toggleForm(id, show) {
    document.getElementById(id).classList.toggle('show', show);
}

function cancelPortfolioForm() {
    editingIndex = null;
    resetPortfolioForm();
    toggleForm('Subnautica', false);
}

function cancelCommissionForm() {
    editingIndex = null;
    resetCommissionForm();
    toggleForm('Minecraft', false);
}

function resetPortfolioForm() {
    document.getElementById('PTitle').value = '';
    document.getElementById('PDesc').value = '';
    pendingPortfolioImage = null;
    setFormImage('PPreviewPhoto', 'ImNotSureYetPhoto', '');
}

function resetCommissionForm() {
    document.getElementById('CTitle').value = '';
    document.getElementById('CDesc').value = '';
    pendingCommissionImage = null;
    setFormImage('CPreviewPhoto', 'NeitherThisOne', '');
    setStatusButton('open');
}

function setFormImage(imgId, spanId, image) {
    const img = document.getElementById(imgId);
    document.getElementById(spanId).style.display = image ? 'none' : '';

    if (!image) {
        img.removeAttribute('src');
        img.classList.remove('has-image');
        return;
    }

    img.classList.add('has-image');
    showImage(img, image);
}

function setStatusButton(status) {
    const btn = document.getElementById('CStatusButton');
    const isOpen = String(status || 'open').toLowerCase() === 'open';

    btn.textContent = isOpen ? 'OPEN' : 'CLOSED';
    btn.classList.toggle('statusOpen', isOpen);
    btn.classList.toggle('statusClosed', !isOpen);
}

function toggleCommissionStatus() {
    const isOpen = document.getElementById('CStatusButton').classList.contains('statusOpen');

    setStatusButton(isOpen ? 'closed' : 'open');
}

function previewPortfolioPhoto(event) {
    readImageFile(event, 'PPreviewPhoto', dataUrl => pendingPortfolioImage = dataUrl);
}

function previewCommissionPhoto(event) {
    readImageFile(event, 'CPreviewPhoto', dataUrl => pendingCommissionImage = dataUrl);
}

function readImageFile(event, imgId, onReady) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
        alert('Please pick an image smaller than 1 MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = loaded => {
        const img = document.getElementById(imgId);
        img.classList.add('has-image');
        showImage(img, loaded.target.result);

        const span = img.nextElementSibling;
        if (span && span.tagName === 'SPAN') span.style.display = 'none';

        if (onReady) onReady(loaded.target.result);
    };
    reader.readAsDataURL(file);
}

/* Commission terms (owner only) */
function openCommissionTermsModal(index) {
    if (!isOwner || index === null) return;

    const item = profile.commissions[index];
    if (!item) return;

    selectedCommissionIndex = index;
    document.getElementById('TermsTextarea').value = item.terms || '';
    document.getElementById('TermsTypeSelect').value = item.type || '';

    toggleForm('CommissionTermsModal', true);
}

async function saveCommissionTerms() {
    const item = profile.commissions[selectedCommissionIndex];

    if (item) {
        item.terms = document.getElementById('TermsTextarea').value;
        item.type = document.getElementById('TermsTypeSelect').value;
        await persistProfile();
    }

    toggleForm('CommissionTermsModal', false);
}
/* Galleries */
function renderGalleries() {
    renderGalleryCards(document.getElementById('ProfilePortfolioPicnic'), withIndex(profile.artworks),
        item => {
            if (!editMode) viewer.open(item);
        }, { empty: 'ProfilePortfolioEmpty', ...editOptions('portfolio') });

    renderCommissionCards(document.getElementById('ProfileCommissionPicnic'), withIndex(profile.packages),
        item => {
            if (!editMode) viewer.open(item, true);
        }, { empty: 'ProfileCommissionEmpty', ...editOptions('commission') });
}

/* Cards carry the stored index so an edit always lands on the right entry */
function withIndex(items) {
    return items.map((item, index) => ({ ...item, index }));
}

/* Visitors get no edit callbacks, so no edit buttons are built for them */
function editOptions(type) {
    if (!isOwner) return {};

    if (type === 'commission') {
        const options = { onTerms: item => openCommissionTermsModal(item.index) };

        if (editMode) options.onEdit = item => openEditForm('commission', item.index);
        return options;
    }

    return editMode
        ? { overlay: 'Edit', onEdit: item => openEditForm('portfolio', item.index) }
        : {};
}

/* Everything below only runs on your own profile */
function setupOwner() {
    document.getElementById('ProfileToolbar').style.display = 'flex';
    document.getElementById('button4Dashboard').style.display = '';
    document.getElementById('ProfileBio').style.cursor = 'pointer';
    document.getElementById('ProfileBio').addEventListener('click', startBioEdit);

    document.getElementById('DashClientName').textContent = profile.username;
    document.getElementById('DashClientEmail').textContent = profile.email;
    document.getElementById('DashArtistName').textContent = profile.username;
    document.getElementById('DashArtistEmail').textContent = profile.email;

    setupImagePicker('ProfileBanner', 'bannerInput', 'backgroundpicture', BANNER_FALLBACK);
    setupImagePicker('ProfileAvatar', 'avatarInput', 'profilepicture');
}

function setupImagePicker(imgId, inputId, property, fallback) {
    const img = document.getElementById(imgId);
    const input = document.getElementById(inputId);

    img.style.cursor = 'pointer';
    img.addEventListener('click', () => input.click());

    input.addEventListener('change', event => readImageFile(event, imgId, async dataUrl => {
        const previous = profile[property];
        profile[property] = dataUrl;

        if (!(await persistProfile())) {
            profile[property] = previous;
            return;
        }

        showImage(img, profile[property], fallback);
    }));
}

function startBioEdit() {
    const textarea = document.getElementById('MyDescEdit');

    textarea.value = profile.bio || Account.DEFAULT_BIO;
    textarea.style.display = 'block';
    document.getElementById('ProfileBioActions').style.display = 'flex';
    document.getElementById('ProfileBio').style.display = 'none';
    textarea.focus();
}

async function saveBioEdit() {
    const previous = profile.bio;
    profile.bio = document.getElementById('MyDescEdit').value.trim();

    if (!(await persistProfile())) {
        profile.bio = previous;
        return;
    }

    cancelBioEdit();
}

function cancelBioEdit() {
    document.getElementById('MyDescEdit').style.display = 'none';
    document.getElementById('ProfileBioActions').style.display = 'none';
    document.getElementById('ProfileBio').style.display = '';

    renderBio();
}

function renderBio() {
    document.getElementById('ProfileBio').textContent = profile.bio || Account.DEFAULT_BIO;
}

function renderProfile() {
    document.getElementById('ProfileUsername').textContent = profile.username;
    renderBio();
    document.getElementById('ProfileArtworkCount').textContent = profile.artworks.length;
    document.getElementById('ProfileCommissionCount').textContent = profile.packages.length;

    showImage(document.getElementById('ProfileBanner'), profile.banner, BANNER_FALLBACK);
    showImage(document.getElementById('ProfileAvatar'), profile.avatar);

    if (isOwner) setupOwner();

    renderGalleries();
    showSection('portfolio');
    document.getElementById('ProfilePage').style.display = 'block';
}

function showMissingProfile(name) {
    document.getElementById('ProfileMissingText').textContent = name
        ? `${name} hasn't set up a profile yet.`
        : 'No artist was selected.';
    document.getElementById('ProfileMissing').style.display = 'block';
}

/* No ?user= / ?id= means your own profile, otherwise the linked artist's */
async function initProfile(account) {
    LEGACY_GALLERY_KEYS.forEach(key => localStorage.removeItem(key));

    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const id = params.get('id');
    const wanted = username || id;

    profile = wanted
        ? (username ? await Account.byUsername(username) : await Account.byId(id))
        : account;

    isOwner = Boolean(profile) && profile.id === account.id;

    if (!(profile instanceof Artist)) {
        showMissingProfile(wanted || account.username);
        return;
    }

    renderProfile();
}

Account.protectPage(initProfile);
