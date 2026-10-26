/* Account data + JSON storage */
class Account {
    static SOURCE = 'data/accounts.json';
    static STORE = 'ArtifyPH_Accounts';
    static COMMISSION_AVAILABILITY_MIGRATION = 'ArtifyPH_CommissionAvailabilityMigration';
    static COMMISSION_OPEN_ARTISTS = [
        '_BELPHIE',
        'Blubytrave890',
        'HeartFeltCraftsByAngie',
        'TylorHepnerArt',
        'Bee_Bianca',
        'edgichel',
        'Maboroshiiiro',
        'Crocheana',
        'Camryngamesyt',
        'Fanfive'
    ];
    static SESSION = 'ArtifyPH_Current';
    static LOGIN = 'login.html';
    static HOME = 'home.html';
    static INDEX = 'index.html';
    static ROLE = 'account';
    static DEFAULT_BIO = 'Hello!';

    /* local storage account fallback (we might remove this soon) */
    static DEFAULTS = [
        {
            role: 'artist',
            id: 'acc_justablub',
            username: 'Justablub',
            email: 'ilosthotdogs@gmail.com',
            password: 'Beezytrave890',
            bio: Account.DEFAULT_BIO,
            portfolio: [],
            commissions: []
        }
    ];

    static #accounts = null;

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
        const accounts = await Account.all();
        const index = accounts.findIndex(account => account.id === this.id);

        if (index === -1) {
            accounts.push(this);
        } else {
            accounts[index] = this;
        }

        localStorage.setItem(Account.STORE, JSON.stringify(accounts.map(account => account.toJSON())));
        Account.setCurrent(this);
        return this;
    }

    static fromJSON(data) {
        return data.role === Artist.ROLE
            ? Artist.fromJSON(data)
            : new Account(data.username, data.email, data.password, data.id);
    }

    static async all() {
        if (!Account.#accounts) {
            const data = await Account.read();
            Account.#accounts = data.map(Account.fromJSON);
        }
        return Account.#accounts;
    }

    static async read() {
        const mirror = localStorage.getItem(Account.STORE);
        const localAccounts = mirror ? JSON.parse(mirror) : null;
        let sourceAccounts;

        try {
            const response = await fetch(Account.SOURCE);
            if (!response.ok) throw new Error('accounts.json returned ' + response.status);
            sourceAccounts = await response.json();
        } catch (error) {
            return localAccounts || Account.DEFAULTS;
        }

        if (!localAccounts) return sourceAccounts;

        if (localStorage.getItem(Account.COMMISSION_AVAILABILITY_MIGRATION) !== '1') {
            const sourceByUsername = new Map(sourceAccounts.map(account => [account.username, account]));

            localAccounts.forEach(account => {
                if (!Account.COMMISSION_OPEN_ARTISTS.includes(account.username)) return;

                const source = sourceByUsername.get(account.username);
                if (!source) return;

                const commissions = Array.isArray(account.commissions) ? account.commissions : [];
                (source.commissions || [])
                    .filter(item => String(item.status || '').toLowerCase() === 'open')
                    .forEach(sourceItem => {
                        const existing = commissions.find(item => item.ctitle === sourceItem.ctitle);
                        if (existing) {
                            existing.status = 'open';
                        } else {
                            commissions.push(sourceItem);
                        }
                    });

                account.commissions = commissions;
            });

            localStorage.setItem(Account.STORE, JSON.stringify(localAccounts));
            localStorage.setItem(Account.COMMISSION_AVAILABILITY_MIGRATION, '1');
        }

        return localAccounts;
    }

    static async find(identifier, password) {
        const accounts = await Account.all();
        return accounts.find(account => account.matches(identifier, password)) || null;
    }

    static async conflict(username, email) {
        const accounts = await Account.all();

        if (accounts.some(account => account.username === username)) {
            return 'Username is already taken.';
        }
        if (accounts.some(account => account.email === email)) {
            return 'Email is already registered.';
        }
        return '';
    }

    static async byId(id) {
        if (!id) return null;

        const accounts = await Account.all();
        return accounts.find(account => account.id === id) || null;
    }

    static async byUsername(username) {
        if (!username) return null;

        const key = String(username).toLowerCase();
        const accounts = await Account.all();
        return accounts.find(account => account.username.toLowerCase() === key) || null;
    }

    static async current() {
        return Account.byId(localStorage.getItem(Account.SESSION));
    }

    static setCurrent(account) {
        localStorage.setItem(Account.SESSION, account.id);
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

    /* Reset the local storage fr */
    static reset() {
        localStorage.removeItem(Account.STORE);
        localStorage.removeItem(Account.SESSION);
        Account.#accounts = null;
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
            bio: this.bio,
            portfolio: this.portfolio,
            commissions: this.commissions,
            acceptsCommissions: this.acceptsCommissions
        };
    }

    static fromJSON(data) {
        const artist = new Artist(
            data.username,
            data.email,
            data.password,
            data.bio || '',
            data.portfolio || [],
            data.commissions || [],
            data.id,
            data.folder || '',
            data.profilepicture || '',
            data.backgroundpicture || ''
        );
        if (typeof data.acceptsCommissions === 'boolean') {
            artist.acceptsCommissions = data.acceptsCommissions;
        }
        return artist;
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
