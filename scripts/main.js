const SESSION_KEY = 'ArtifyPH_Current';

/* Build the shared header dynamically based on auth state + current page. */
const buildHeader = () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthPage = page === 'login.html' || page === 'signup.html';
    const loggedIn = !!localStorage.getItem(SESSION_KEY);

    /* Auth page (log in / sign up) show only the logo. */
    if (isAuthPage) {
        return `
<nav class="navbar navbar-expand-md bg-artify navbar-dark fixed-top">
    <div class="container-fluid">
        <a class="navbar-brand" href="./index.html">
            <img class="ArtifyPHLogo" src="./assets/images/ArtifyPH_Logo.png" alt="ArtifyPHLogo">
        </a>
    </div>
</nav>
`;
    }

    const navbar = (links, loggedIn) => `
<nav class="navbar navbar-expand-md bg-artify navbar-dark fixed-top sticky-header">
    <div class="container-fluid">
        <a class="navbar-brand" href="./index.html">
            <img class="ArtifyPHLogo" src="./assets/images/ArtifyPH_Logo.png" alt="ArtifyPHLogo">
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            ${loggedIn ? `
            <form class="d-flex navbar-search ms-auto" role="search">
                <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
                <button class="btn btn-outline-light" type="submit">Search</button>
            </form>
            ` : ''}

            <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                ${links}
            </ul>
        </div>
    </div>
</nav>
`;

    /* Logged out: Home, FAQs, Log in, Sign up. */
    if (!loggedIn) {
        return navbar(`
<li class="nav-item">
    <a class="nav-link" aria-current="page" href="./home.html">Home</a>
</li>
<li class="nav-item">
    <a class="nav-link" href="#FAQs">FAQs</a>
</li>
<li class="nav-item">
    <a class="nav-link" href="./login.html">Log in</a>
</li>
<li class="nav-item">
    <a class="nav-link" href="./signup.html">Sign up</a>
</li>
`, false);
    }

    /* Logged in: Home, FAQs, Account dropdown (Profile, Settings, Logout). */
    return navbar(`
<li class="nav-item">
    <a class="nav-link active" aria-current="page" href="./home.html">Home</a>
</li>
<li class="nav-item">
    <a class="nav-link" href="#FAQs">FAQs</a>
</li>
<li class="nav-item dropdown">
    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        Account
    </a>
    <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="./profile.html">Profile</a></li>
        <li><a class="dropdown-item" href="./settings.html">Settings</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" onclick="window.logoutUser()">Logout</a></li>
    </ul>
</li>
`, true);
};

const FOOTER_HTML = `
<footer class="footer">
    <div class="footercontent">
        <img src="assets/images/ArtifyPH_Logo.png" alt="ArtifyPH Logo" class="artlogo">
        <p class="slogan">Art by Hand</p>
        <p class="contact">ArtifyPH@gmail.com</p>
        <p class="legal">© 2026 ArtifyPH | For School Education Purposes Only</p>
    </div>
</footer>
`;

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("#header");
    const footer = document.querySelector("#footer");

    if (header) {
        header.innerHTML = buildHeader();
    }
    if (footer) {
        footer.innerHTML = FOOTER_HTML;
    }
});

/* Logout */
window.logoutUser = function () {
    if (typeof Account !== 'undefined' && typeof Account.logout === 'function') {
        Account.logout();
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
    window.location.href = './index.html';
};
