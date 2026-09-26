function previewImage(event, imgId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.getElementById(imgId);
        img.src = e.target.result;
        img.classList.add('has-image');

        const span = img.nextElementSibling;
        if (span && span.tagName === 'SPAN') {
            span.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

function showSection(section) {
    const portfolio = document.getElementById('MyProfileImagesPortfolio');
    const commissions = document.getElementById('MyProfileImagesCommissions');
    const dashboard = document.getElementById('MyProfileDashboard');
    const button4Portfolio = document.getElementById('button4Portfolio');
    const button4Commission = document.getElementById('button4Commission');
    const button4Dashboard = document.getElementById('button4Dashboard');

    portfolio.style.display = 'none';
    commissions.style.display = 'none';
    dashboard.style.display = 'none';

    button4Portfolio.classList.remove('active');
    button4Commission.classList.remove('active');
    button4Dashboard.classList.remove('active');

    if (section === 'portfolio') {
        portfolio.style.display = 'block';
        button4Portfolio.classList.add('active');
    } else if (section === 'commission') {
        commissions.style.display = 'block';
        button4Commission.classList.add('active');
    } else if (section === 'dashboard') {
        dashboard.style.display = 'block';
        button4Dashboard.classList.add('active');
    }
}

function toggleForm(id, show) {
    document.getElementById(id).classList.toggle('show', show);
}

function toggleCommissionStatus() {
    const btn = document.getElementById('CStatusButton');
    const isOpen = btn.classList.contains('statusOpen');

    if (isOpen) {
        btn.textContent = 'CLOSED';
        btn.classList.remove('statusOpen');
        btn.classList.add('statusClosed');
    } else {
        btn.textContent = 'OPEN';
        btn.classList.remove('statusClosed');
        btn.classList.add('statusOpen');
    }
}

let editMode = false;
let editingItemId = null;
let editingItemType = null;

function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('ButtonWobblyGoopler');
    btn.textContent = editMode ? 'Done' : 'Edit';
    renderGalleries();
}

let viewingItemId = null;
let viewingItemType = null;
let selectedCommissionId = null;

function AddPortfolioForm() {
    editingItemId = null;
    editingItemType = null;

    const isPortfolio = document.getElementById('button4Portfolio').classList.contains('active');
    if (isPortfolio) {
        resetPortfolioForm();
        toggleForm('Subnautica', true);
    } else {
        resetCommissionForm();
        toggleForm('Minecraft', true);
    }
}

function openEditForm(type, id) {
    editingItemId = id;
    editingItemType = type;

    const key = type === 'portfolio' ? 'artifyph_portfolio' : 'artifyph_commission';
    const items = JSON.parse(localStorage.getItem(key)) || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (type === 'portfolio') {
        document.getElementById('PTitle').value = item.title;
        document.getElementById('PDesc').value = item.desc;
        const img = document.getElementById('PPreviewPhoto');
        img.src = item.image;
        img.classList.add('has-image');
        document.getElementById('ImNotSureYetPhoto').style.display = 'none';
        toggleForm('Subnautica', true);
    } else {
        document.getElementById('CTitle').value = item.title;
        document.getElementById('CDesc').value = item.desc;
        const img = document.getElementById('CPreviewPhoto');
        img.src = item.image;
        img.classList.add('has-image');
        document.getElementById('NeitherThisOne').style.display = 'none';

        const btn = document.getElementById('CStatusButton');
        const isClosed = item.status === 'CLOSED';
        btn.textContent = isClosed ? 'CLOSED' : 'OPEN';
        btn.classList.toggle('statusClosed', isClosed);
        btn.classList.toggle('statusOpen', !isClosed);

        toggleForm('Minecraft', true);
    }
}

function openEditFromView() {
    toggleForm('AlbionOnline', false);
    openEditForm(viewingItemType, viewingItemId);
}

function SaveP() {
    const previewImg = document.getElementById('PPreviewPhoto');
    const ptitle = document.getElementById('PTitle').value;
    const pdesc = document.getElementById('PDesc').value;

    if (!previewImg.classList.contains('has-image')) {
        alert('Please upload a photo first.');
        return;
    }

    let saved = JSON.parse(localStorage.getItem('artifyph_portfolio')) || [];

    if (editingItemId) {
        const idx = saved.findIndex(i => i.id === editingItemId);
        if (idx !== -1) {
            saved[idx].image = previewImg.src;
            saved[idx].title = ptitle;
            saved[idx].desc = pdesc;
        }
    } else {
        saved.push({
            id: Date.now().toString(),
            image: previewImg.src,
            title: ptitle,
            desc: pdesc
        });
    }

    localStorage.setItem('artifyph_portfolio', JSON.stringify(saved));

    editingItemId = null;
    editingItemType = null;
    renderGalleries();
    resetPortfolioForm();
    toggleForm('Subnautica', false);
}

function SaveC() {
    const previewImg = document.getElementById('CPreviewPhoto');
    const ctitle = document.getElementById('CTitle').value;
    const cdesc = document.getElementById('CDesc').value;
    const cstatus = document.getElementById('CStatusButton').classList.contains('statusOpen') ? 'OPEN' : 'CLOSED';

    if (!previewImg.classList.contains('has-image')) {
        alert('Please upload a photo first.');
        return;
    }

    let saved = JSON.parse(localStorage.getItem('artifyph_commission')) || [];

    if (editingItemId) {
        const idx = saved.findIndex(i => i.id === editingItemId);
        if (idx !== -1) {
            saved[idx].image = previewImg.src;
            saved[idx].title = ctitle;
            saved[idx].desc = cdesc;
            saved[idx].status = cstatus;
        }
    } else {
        saved.push({
            id: Date.now().toString(),
            image: previewImg.src,
            title: ctitle,
            desc: cdesc,
            status: cstatus
        });
    }

    localStorage.setItem('artifyph_commission', JSON.stringify(saved));

    editingItemId = null;
    editingItemType = null;
    renderGalleries();
    resetCommissionForm();
    toggleForm('Minecraft', false);
}

function resetPortfolioForm() {
    document.getElementById('PTitle').value = '';
    document.getElementById('PDesc').value = '';
    const img = document.getElementById('PPreviewPhoto');
    img.src = '';
    img.classList.remove('has-image');
    document.getElementById('ImNotSureYetPhoto').style.display = '';
}

function resetCommissionForm() {
    document.getElementById('CTitle').value = '';
    document.getElementById('CDesc').value = '';
    const img = document.getElementById('CPreviewPhoto');
    img.src = '';
    img.classList.remove('has-image');
    document.getElementById('NeitherThisOne').style.display = '';

    const btn = document.getElementById('CStatusButton');
    btn.textContent = 'OPEN';
    btn.classList.remove('statusClosed');
    btn.classList.add('statusOpen');
}

function cancelPortfolioForm() {
    editingItemId = null;
    editingItemType = null;
    resetPortfolioForm();
    toggleForm('Subnautica', false);
}

function cancelCommissionForm() {
    editingItemId = null;
    editingItemType = null;
    resetCommissionForm();
    toggleForm('Minecraft', false);
}

function renderGalleries() {
    renderOneGallery('artifyph_portfolio', 'portfoliopicnic', 'portfolio');
    renderOneGallery('artifyph_commission', 'commissionpicnic', 'commission');
}

function renderOneGallery(storageKey, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const items = JSON.parse(localStorage.getItem(storageKey)) || [];

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'GalleryCard';

        const img = document.createElement('img');
        img.src = item.image;
        img.className = 'GalleryThumb';
        card.appendChild(img);

        if (editMode) {
            const overlay = document.createElement('div');
            overlay.className = 'EditOverlay';
            overlay.textContent = 'Edit';
            overlay.onclick = () => openEditForm(type, item.id);
            card.appendChild(overlay);
        } else if (type === 'commission') {
            card.onclick = () => selectCommission(item.id);
        } else {
            card.onclick = () => PreviewImgYYes(type, item.id);
        }

        container.appendChild(card);
    });
}

function selectCommission(id) {
    selectedCommissionId = id;

    const items = JSON.parse(localStorage.getItem('artifyph_commission')) || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('CPreviewImage').src = item.image;
    document.getElementById('CPreviewTitle').textContent = item.title || 'Untitled';
    document.getElementById('CPreviewDesc').textContent = item.desc;
    document.getElementById('CPreviewStatus').textContent = item.status;

    document.getElementById('CommissionPreviewCard').style.display = 'flex';
}

function PreviewImgYYes(type, id) {
    viewingItemId = id;
    viewingItemType = type;

    const key = type === 'portfolio' ? 'artifyph_portfolio' : 'artifyph_commission';
    const items = JSON.parse(localStorage.getItem(key)) || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('ViewImage').src = item.image;
    document.getElementById('ViewTitle').textContent = item.title || 'Untitled';
    document.getElementById('ViewDesc').textContent = item.desc;

    const statusRow = document.getElementById('ViewStatusRow');
    if (type === 'commission') {
        statusRow.style.display = 'flex';
        document.getElementById('ViewStatus').textContent = item.status;
    } else {
        statusRow.style.display = 'none';
    }

    toggleForm('AlbionOnline', true);
}

const defaultPortfolioImages = [
    "assets/images/MyProfileExamples/Portfolio1.png",
    "assets/images/MyProfileExamples/Portfolio2.png"
];

const defaultCommissionImages = [
    "assets/images/MyProfileExamples/Commission1.png",
    "assets/images/MyProfileExamples/Commission2.png"
];

function ProfileSettingsSync(account) {
    document.getElementById('MyUsername').textContent = account.username;
    document.getElementById('MyDesc').textContent = account.bio || Account.DEFAULT_BIO;

    showSection('portfolio');
    if (typeof renderGalleries === 'function') {
        renderGalleries();
    }
}

function openCommissionTermsModal(id) {
    if (id) selectedCommissionId = id;
    if (!selectedCommissionId) return;

    const items = JSON.parse(localStorage.getItem('artifyph_commission')) || [];
    const item = items.find(i => i.id === selectedCommissionId);
    if (!item) return;

    document.getElementById('TermsTextarea').value = item.terms || '';
    document.getElementById('TermsTypeSelect').value = item.type || '';
    toggleForm('CommissionTermsModal', true);
}

function saveCommissionTerms() {
    const terms = document.getElementById('TermsTextarea').value;
    const type = document.getElementById('TermsTypeSelect').value;

    if (selectedCommissionId) {
        let items = JSON.parse(localStorage.getItem('artifyph_commission')) || [];
        const idx = items.findIndex(i => i.id === selectedCommissionId);
        if (idx !== -1) {
            items[idx].terms = terms;
            items[idx].type = type;
            localStorage.setItem('artifyph_commission', JSON.stringify(items));
        }
    }

    toggleForm('CommissionTermsModal', false);
}

Account.protectPage(ProfileSettingsSync);