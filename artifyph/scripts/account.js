/* Account data + MySQL storage (MySQL users table) */
class Account {
    static API = '/api/users';
    static SESSION = 'ArtifyPH_Current';
    static LOGIN = 'login.html';
    static HOME = 'home.html';
    static INDEX = 'index.html';
    static ROLE = 'account';
    static DEFAULT_BIO = 'Hello!';

    constructor(username, email, password, id = null) {
        this.id = id || 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        this.username = username;
        this.email = email;
        this.password = password;
    }

    get role() {
        return Account.ROLE;
    }

    canUploadArtwork() {
        return false;
    }

    matches(identifier, password) {
        return (this.username === identifier || this.email === identifier) && this.password === password;
    }

    toJSON() {
        return {
            role: this.role,
            id: this.id,
            username: this.username,
            email: this.email,
            password: this.password
        };
    }

    async save() {
        const existing = await Account.byId(this.id);

        if (existing) {
            await fetch(`${Account.API}/${this.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.toJSON())
            });
        } else {
            await fetch(Account.API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.toJSON())
            });
        }

        Account.setCurrent(this);
        return this;
    }

    static fromJSON(data) {
        return data.role === Artist.ROLE
            ? Artist.fromJSON(data)
            : new Account(data.username, data.email, data.password, data.id);
    }

    static async all() {
        const res = await fetch(Account.API);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map(Account.fromJSON);
    }

    static async byId(id) {
        const res = await fetch(`${Account.API}/${id}`);
        if (!res.ok) return null;
        return Account.fromJSON(await res.json());
    }

    static async byUsername(username) {
        if (!username) return null;

        const key = String(username).trim().toLowerCase();
        const accounts = await Account.all();
        return accounts.find(account => account.username.toLowerCase() === key) || null;
    }

    static async find(identifier, password) {
        const accounts = await Account.all();
        return accounts.find(account => account.matches(identifier, password)) || null;
    }

    static async conflict(username, email) {
        const res = await fetch(`${Account.API}/conflict?${new URLSearchParams({ username, email })}`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.conflict || '';
    }

    static setCurrent(account) {
        localStorage.setItem(Account.SESSION, account.id);
    }

    static async current() {
        return Account.byId(localStorage.getItem(Account.SESSION));
    }

    static async login(identifier, password) {
        const res = await fetch(`${Account.API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Login failed');
        }

        const data = await res.json();
        Account.setCurrent(data.account);
        return data.account;
    }

    static logout() {
        localStorage.removeItem(Account.SESSION);
    }

    /* Check account */
    static async requireLogin() {
        return Account.#gate(account => !account, Account.LOGIN);
    }

    /* Check guest */
    static async requireGuest() {
        return Account.#gate(account => Boolean(account), Account.HOME);
    }

    /* This function adds login gate to page */
    static protectPage(onAllowed = null) {
        return Account.#protect(Account.requireLogin, onAllowed);
    }

    /* This function keeps logged in users away from login and sign up */
    static protectGuestPage() {
        return Account.#protect(Account.requireGuest);
    }

    static async #gate(blocked, destination) {
        if (document.body) document.body.style.visibility = 'hidden';

        const account = await Account.current();

        if (blocked(account)) {
            window.location.replace(destination);
            return null;
        }

        if (document.body) document.body.style.visibility = '';
        return account;
    }

    static #protect(gate, onAllowed = null) {
        const run = async () => {
            const account = await gate();
            if (account && onAllowed) onAllowed(account);
        };

        window.addEventListener('pageshow', event => {
            if (event.persisted) run();
        });

        return run();
    }

    static reset() {
        localStorage.removeItem(Account.SESSION);
    }
}

class Artist extends Account {
    static ROLE = 'artist';
    static ASSETS = 'assets/images/';
    static AVATAR = 'MyAvatar_Pic_Template.png';
    static BANNER = 'MyProfile_BG_Template.png';

    constructor(username, email, password, bio = '', portfolio = [], commissions = [], id = null, folder = '', profilepicture = '', backgroundpicture = '') {
        super(username, email, password, id);
        this.bio = bio;
        this.portfolio = portfolio;
        this.commissions = commissions;
        this.folder = folder;
        this.profilepicture = profilepicture;
        this.backgroundpicture = backgroundpicture;
    }

    get role() {
        return Artist.ROLE;
    }

    canUploadArtwork() {
        return true;
    }

    /* Uploads and already resolved paths are stored as they are */
    static RESOLVED = /^(data:|blob:|https?:|\/|assets\/)/;

    /* Every asset path is built here so pages never guess the folder */
    static assetPath(folder, file) {
        if (!file) return '';
        if (Artist.RESOLVED.test(file)) return file;

        return folder ? `${Artist.ASSETS}${folder}/${file}` : '';
    }

    get avatar() {
        return Artist.assetPath(this.folder, this.profilepicture) || Artist.ASSETS + Artist.AVATAR;
    }

    get banner() {
        return Artist.assetPath(this.folder, this.backgroundpicture) || Artist.ASSETS + Artist.BANNER;
    }

    get artworks() {
        return this.portfolio.map(item => ({
            image: Artist.assetPath(this.folder, item.image),
            title: item.ptitle || 'Untitled',
            desc: item.pdesc || ''
        }));
    }

    get packages() {
        return this.commissions.map(item => ({
            image: Artist.assetPath(this.folder, item.image),
            title: item.ctitle || 'Untitled',
            desc: item.cdesc || '',
            status: (item.status || 'closed').toLowerCase()
        }));
    }

    toJSON() {
        return {
            ...super.toJSON(),
            folder: this.folder,
            profilepicture: this.profilepicture,
            backgroundpicture: this.backgroundpicture,
            bio: this.bio
        };
    }

    static fromJSON(data) {
        return new Artist(
            data.username,
            data.email,
            data.password,
            data.bio || '',
            [],
            [],
            data.id,
            data.folder || '',
            data.profilepicture || '',
            data.backgroundpicture || ''
        );
    }
}

/* Show or hide password fields (data-targets="fieldId fieldId") */
function setupShowPassword() {
    document.querySelectorAll('input[type="checkbox"][data-targets]').forEach(checkbox => {
        const inputs = checkbox.dataset.targets.split(' ')
            .map(id => document.getElementById(id))
            .filter(Boolean);

        checkbox.addEventListener('change', function () {
            const type = this.checked ? 'text' : 'password';
            inputs.forEach(input => input.type = type);
        });
    });
}

