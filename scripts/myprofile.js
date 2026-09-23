/*For The Image Preview (banner/avatar) */
function previewImage(event, imgId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById(imgId).src = e.target.result;
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

function ProfileSettingsSync() {
    const username = localStorage.getItem('LoggedUser');
    if (username) {
        document.getElementById('MyUsername').textContent = username;
    } else {
        window.location.href = "login.html";
        return;
    }

    const bio = localStorage.getItem('BioDesc');
    document.getElementById('MyDesc').textContent = bio || 'Hello!';

    showSection('portfolio');
    if (typeof renderGalleries === 'function') {
        renderGalleries();
    }
}

window.onload = ProfileSettingsSync;
window.addEventListener('pageshow', ProfileSettingsSync);