/* Commission requests */
const Commission = {
    FORM: 'commissionform2.html',
    PAYMENT: 'paymentmethod.html',
    STORE: 'ArtifyPH_Requests',
    FIELDS: [
        { id: 'name', label: 'Name / Username' },
        { id: 'email', label: 'Email' },
        { id: 'type', label: 'Commission Type' },
        { id: 'deadline', label: 'Deadline' },
        { id: 'budget', label: 'Budget' }
    ],
    STATUS: {
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        'in-progress': 'In Progress',
        received: 'Artwork Received'
    },
    NO_TERMS: 'Please accept the Terms of Service before continuing.',
    NO_CONFIRM: 'Please confirm you understand the request may not be accepted.',

    element(id) {
        return document.getElementById(id);
    },

    setText(id, text) {
        const node = Commission.element(id);
        if (node) node.textContent = text;
    },

    value(id) {
        const field = Commission.element(id);
        return field ? field.value.trim() : '';
    },

    checked(id) {
        const field = Commission.element(id);
        return Boolean(field) && field.checked;
    },

    fail(message) {
        Commission.setText('CommissionError', message);
    },

    clear() {
        Commission.fail('');
    },

    params() {
        return new URLSearchParams(window.location.search);
    },

    /* Keeps ?artist= / ?package= / ?wip= alive between the two form pages */
    link(page, extra = {}) {
        const params = Commission.params();

        Object.entries(extra).forEach(([key, item]) => params.set(key, item));

        const query = params.toString();
        return query ? `${page}?${query}` : page;
    },

    all() {
        try {
            return JSON.parse(localStorage.getItem(Commission.STORE)) || [];
        } catch (error) {
            return [];
        }
    },

    write(requests) {
        localStorage.setItem(Commission.STORE, JSON.stringify(requests));
    },

    session() {
        return localStorage.getItem(Account.SESSION) || '';
    },

    create(request) {
        const requests = Commission.all();
        const record = {
            id: 'req_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ...request
        };

        requests.push(record);
        Commission.write(requests);
        return record;
    },

    update(id, changes) {
        const requests = Commission.all();
        const record = requests.find(request => request.id === id);
        if (!record) return null;

        Object.assign(record, changes);
        Commission.write(requests);
        return record;
    },

    /* Newest request sent */
    latest() {
        const mine = Commission.all().filter(request => request.clientId === Commission.session());
        return mine.length ? mine[mine.length - 1] : null;
    },

    /* The request the payment pages are paying for */
    pending() {
        const request = Commission.latest();
        return request && !request.paid ? request : null;
    },

    paid(id, method, reference) {
        return Commission.update(id, {
            paid: true,
            method,
            reference,
            paidAt: new Date().toISOString()
        });
    },

    byArtist(artistId) {
        return Commission.all().filter(request => artistId && request.artistId === artistId).reverse();
    },

    byClient(clientId) {
        return Commission.all().filter(request => clientId && request.clientId === clientId).reverse();
    },

    /* Rejecting, refunds */
    setStatus(id, status) {
        return status === 'rejected'
            ? Commission.update(id, { status, paid: false, method: '', reference: '', paidAt: '' })
            : Commission.update(id, { status });
    },

    statusLabel(status) {
        return Commission.STATUS[status] || Commission.STATUS.pending;
    }
};

/* Shows which artist the request is for */
async function showCommissionTarget(account = null) {
    if (account) {
        const nameField = Commission.element('name');
        const emailField = Commission.element('email');
        if (nameField && !nameField.value) nameField.value = account.username || '';
        if (emailField && !emailField.value) emailField.value = account.email || '';
    }

    const artistId = Commission.params().get('artist');
    if (!artistId) return;

    const artist = await Account.byId(artistId);
    if (!artist) return;

    Commission.setText('TargetArtist', `Commissioning: ${artist.username}`);

    const title = Commission.params().get('package');
    const pack = (artist.commissions || []).find(item => item.ctitle === title);

    if (pack && pack.terms) Commission.setText('TermsText', pack.terms);
}

/* commissionform.html */
function acceptTerms(event) {
    if (event) event.preventDefault();

    if (!Commission.checked('agreement')) return Commission.fail(Commission.NO_TERMS);

    Commission.clear();
    window.location.href = Commission.link(Commission.FORM, { wip: Commission.checked('wip') ? '1' : '0' });
}

/* commissionform2.html */
async function createCommission(event) {
    if (event) event.preventDefault();

    const missing = Commission.FIELDS.find(field => !Commission.value(field.id));
    if (missing) return Commission.fail(`Please fill in your ${missing.label}.`);

    if (!Commission.element('email').checkValidity()) {
        return Commission.fail('Please enter a valid email address.');
    }

    const budget = Number(Commission.value('budget'));
    if (!(budget > 0)) return Commission.fail('Please enter a budget greater than zero.');

    if (!Commission.checked('agreement')) return Commission.fail(Commission.NO_CONFIRM);

    const artist = await Account.byId(Commission.params().get('artist'));
    const details = Commission.element('details');

    Commission.clear();
    Commission.create({
        artistId: artist ? artist.id : '',
        artistName: artist ? artist.username : '',
        artistEmail: artist ? artist.email : '',
        clientId: Commission.session(),
        clientName: Commission.value('name'),
        clientEmail: Commission.value('email'),
        package: Commission.params().get('package') || '',
        type: Commission.value('type'),
        deadline: Commission.value('deadline'),
        budget,
        platform: Commission.value('platform'),
        details: details ? details.value.trim() : '',
        wip: Commission.params().get('wip') === '1',
        status: 'pending',
        paid: false,
        method: '',
        reference: '',
        requestedAt: new Date().toISOString()
    });

    window.location.href = Commission.PAYMENT;
}

function initCommission() {
    const page = document.body.dataset.commission;
    if (!page) return;

    Account.protectPage(showCommissionTarget);
}

initCommission();
