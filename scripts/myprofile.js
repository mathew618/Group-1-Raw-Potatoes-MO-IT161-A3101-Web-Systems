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

function ProfileSettingsSync(account) {
    document.getElementById('MyUsername').textContent = account.username;
    document.getElementById('MyDesc').textContent = account.bio || Account.DEFAULT_BIO;

    showSection('portfolio');
    if (typeof renderGalleries === 'function') {
        renderGalleries();
    }
}

Account.protectPage(ProfileSettingsSync);