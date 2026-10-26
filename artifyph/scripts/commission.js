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
    REFERENCE_TYPES: ['jpeg', 'jpg', 'png', 'avif', 'svg'],
    REFERENCE_MAX_SIZE: 100 * 1024 * 1024,
    UNAVAILABLE_MESSAGE: 'The artist does not accept any commission right now.',

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

    acceptsRequests(artist, packageTitle = '') {
        if (typeof artist?.acceptsCommissions === 'boolean') {
            return artist.acceptsCommissions;
        }

        const packages = artist?.commissions || [];
        const selectedPackage = packageTitle
            ? packages.find(item => item.ctitle === packageTitle)
            : null;

        if (packageTitle) {
            return Boolean(selectedPackage)
                && String(selectedPackage.status || '').toLowerCase() === 'open';
        }

        return packages.some(item => String(item.status || '').toLowerCase() === 'open');
    },

    showUnavailableNotice() {
        let dialog = Commission.element('Komicantcommunicate');
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.id = 'Komicantcommunicate';
            dialog.className = 'Komicantcommunicate';
            dialog.setAttribute('aria-labelledby', 'CommissionUnavailableTitle');
            dialog.setAttribute('aria-describedby', 'CommissionUnavailableMessage');

            const card = document.createElement('div');
            card.className = 'Tadano';

            const title = document.createElement('h2');
            title.id = 'CommissionUnavailableTitle';
            title.textContent = 'OOPS SORRY!';

            const message = document.createElement('p');
            message.id = 'CommissionUnavailableMessage';
            message.textContent = Commission.UNAVAILABLE_MESSAGE;

            const closeButton = document.createElement('button');
            closeButton.className = 'Osana';
            closeButton.type = 'button';
            closeButton.textContent = 'Got it';
            closeButton.addEventListener('click', () => dialog.close());

            card.append(title, message, closeButton);
            dialog.appendChild(card);
            dialog.addEventListener('click', event => {
                if (event.target === dialog) dialog.close();
            });
            document.body.appendChild(dialog);
        }

        dialog.showModal();
        dialog.querySelector('button').focus();
    },

    async requestableArtist() {
        const artist = await Account.byId(Commission.params().get('artist'));
        if (!Commission.acceptsRequests(artist, Commission.params().get('package') || '')) {
            Commission.showUnavailableNotice();
            return null;
        }
        return artist;
    },

    referenceError() {
        const file = Commission.element('reference')?.files?.[0];
        if (!file) return '';

        const extension = file.name.split('.').pop().toLowerCase();
        if (!Commission.REFERENCE_TYPES.includes(extension)) {
            return 'Reference files must be JPEG, JPG, PNG, AVIF, or SVG.';
        }
        if (file.size > Commission.REFERENCE_MAX_SIZE) {
            return 'Reference files must be 100 MB or smaller.';
        }
        return '';
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

    async create(request) {
        const record = {
            id: 'req_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ...request
        };

        const response = await fetch('/api/commission-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Could not save commission request.');

        const requests = Commission.all();
        requests.push(result.commission || record);
        Commission.write(requests);
        return result.commission || record;
    },

    update(id, changes) {
        const requests = Commission.all();
        const record = requests.find(request => request.id === id);
        if (!record) return null;

        Object.assign(record, changes);
        Commission.write(requests);
        fetch(`/api/commission-requests/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes)
        }).catch(() => {});
        return record;
    },

    latest() {
        const mine = Commission.all().filter(request => request.clientId === Commission.session());
        return mine.length ? mine[mine.length - 1] : null;
    },
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
async function acceptTerms(event) {
    if (event) event.preventDefault();

    if (!(await Commission.requestableArtist())) return;
    if (!Commission.checked('agreement')) return Validate.showError('agreement', Commission.NO_TERMS);

    Validate.showError('agreement', '');
    Commission.clear();
    window.location.href = Commission.link(Commission.FORM, { wip: Commission.checked('wip') ? '1' : '0' });
}

/* commissionform2.html */
async function createCommission(event) {
    if (event) event.preventDefault();
    const artist = await Commission.requestableArtist();
    if (!artist) return;

    if (!Commission.value('name') || !Commission.value('email')) {
        return Commission.fail('Your account details did not load. Please log in again.');
    }

    const valid = Validate.run([
        { id: 'type', test: () => Validate.required(Commission.value('type'), 'Commission Type') },
        { id: 'deadline', test: () => Validate.deadline(Commission.value('deadline')) },
        { id: 'budget', test: () => Validate.budget(Commission.value('budget')) },
        { id: 'reference', test: () => Commission.referenceError() },
        { id: 'agreement', test: () => Commission.checked('agreement') ? '' : Commission.NO_CONFIRM }
    ]);
    if (!valid) return;

    const budget = Number(Commission.value('budget'));
    const details = Commission.element('details');

    Commission.clear();
    try {
        await Commission.create({
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
    } catch (error) {
        return Commission.fail(error.message || 'Could not save commission request.');
    }

    window.location.href = Commission.PAYMENT;
}

function initCommission() {
    const page = document.body.dataset.commission;
    if (!page) return;

    if (page === 'terms') {
        const box = Commission.element('agreement');
        if (box) {
            box.addEventListener('change', () => {
                if (box.checked) Validate.showError('agreement', '');
            });
        }
    }

    if (page === 'details') {
        const deadline = Commission.element('deadline');
        if (deadline) deadline.min = Validate.tomorrowISO();
        Validate.wholeNumbersOnly('budget');

        Validate.live('type', () => Validate.required(Commission.value('type'), 'Commission Type'));
        Validate.live('deadline', () => Validate.deadline(Commission.value('deadline')));
        Validate.live('budget', () => Validate.budget(Commission.value('budget')));

        const reference = Commission.element('reference');
        if (reference) {
            reference.addEventListener('change', () => {
                Validate.showError('reference', Commission.referenceError());
            });
        }

        const box = Commission.element('agreement');
        if (box) {
            box.addEventListener('change', () => {
                if (box.checked) Validate.showError('agreement', '');
            });
        }
    }

    Account.protectPage(showCommissionTarget);
}

initCommission();
