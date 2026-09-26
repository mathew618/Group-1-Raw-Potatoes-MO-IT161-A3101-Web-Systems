/*For The Image Preview (banner/avatar) */
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

/*For Switching Between Portfolio and Commissions*/
function showSection(section) {
    const portfolio = document.getElementById('MyProfileImagesPortfolio');
    const commissions = document.getElementById('MyProfileImagesCommissions');
    const button4Portfolio = document.getElementById('button4Portfolio');
    const button4Commission = document.getElementById('button4Commission');

    if (section === 'portfolio') {
        portfolio.style.display = 'block';
        commissions.style.display = 'none';
        button4Portfolio.classList.add('active');
        button4Commission.classList.remove('active');
    } else {
        portfolio.style.display = 'none';
        commissions.style.display = 'block';
        button4Portfolio.classList.remove('active');
        button4Commission.classList.add('active');
    }
}

/*MyProfile Examples Images Test for storing and editing*/
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
function AddPortfolioForm() {
    const isPortfolio = document.getElementById('button4Portfolio').classList.contains('active');
    if (isPortfolio) {
        toggleForm('Subnautica', true);
    } else {
        toggleForm('Minecraft', true);
    }
}

function toggleForm(id, show) {
    document.getElementById(id).classList.toggle('show', show);
}

function SaveP() {
    const pfileInput = document.getElementById('PhotoInput');
    const ptitle = document.getElementById('PTitle').value;
    const pdesc = document.getElementById('PDesc').value;
    toggleForm('Subnautica', false);
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

function SaveC() {
    const cfileInput = document.getElementById('CPhotoInput');
    const ctitle = document.getElementById('CTitle').value;
    const cdesc = document.getElementById('CDesc').value;
    const cstatus = document.getElementById('CStatusButton').classList.contains('statusOpen') ? 'OPEN' : 'CLOSED';

    toggleForm('Minecraft', false);
}

Account.protectPage(ProfileSettingsSync);