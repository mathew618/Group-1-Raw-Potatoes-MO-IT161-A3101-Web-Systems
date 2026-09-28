/* Payment system for showcase (temporary) */
const Payment = {
    PAGES: {
        card: 'cardpayment.html',
        gcash: 'gcashpayment.html'
    },
    MASKS: {
        card: value => Payment.groups(Payment.digits(value).slice(0, 16), [4, 4, 4, 4]),
        expiry: value => Payment.digits(value).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
        gcash: value => Payment.groups(Payment.digits(value).slice(0, 11), [4, 3, 4]),
        digits: value => Payment.digits(value).slice(0, 4)
    },
    REQUIRED: {
        card: ['cardNumber', 'expiry', 'cvv'],
        gcash: ['gcashNumber']
    },
    DELAY: 1200,
    DEFAULT_TOTAL: '₱500.00',
    NOT_DIGITS: /\D/g,

    digits(value) {
        return String(value).replace(Payment.NOT_DIGITS, '');
    },

    /* 1234567812345678 -> 1234 5678 1234 5678 */
    groups(digits, sizes) {
        const parts = [];
        let start = 0;

        sizes.forEach(size => {
            parts.push(digits.slice(start, start + size));
            start += size;
        });

        return parts.filter(Boolean).join(' ');
    },

    element(id) {
        return document.getElementById(id);
    },

    value(id) {
        const field = Payment.element(id);
        return field ? field.value.trim() : '';
    },

    setText(id, text) {
        const node = Payment.element(id);
        if (node) node.textContent = text;
    },

    fail(message) {
        Payment.setText('PaymentError', message);
    },

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /* Receipt matches the total in order summary */
    total() {
        const node = Payment.element('TotalAmount');
        return node && node.textContent.trim() ? node.textContent.trim() : Payment.DEFAULT_TOTAL;
    },

    /* The request this payment is settling (commissionform2.html) */
    request() {
        return typeof Commission === 'undefined' ? null : Commission.pending();
    },

    cash(amount) {
        const value = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `₱${value}`;
    },

    /* The order cost thingy */
    loadOrder() {
        const request = Payment.request();
        if (!request) return;

        Payment.setText('CostAmount', Payment.cash(request.budget));
        Payment.setText('TotalAmount', Payment.cash(request.budget));
    },

    reference() {
        return 'ARTIFY-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    },

    receipt(method, reference) {
        const modal = Payment.element('PaymentSuccess');

        Payment.setText('ReceiptAmount', Payment.total());
        Payment.setText('ReceiptMethod', document.body.dataset.name || method);
        Payment.setText('ReceiptReference', reference);
        Payment.setText('ReceiptDate', new Date().toLocaleString());

        if (modal) modal.classList.add('show');
    },

    /* Records the payment on the dashboard */
    settle(reference) {
        const request = Payment.request();
        if (request) Commission.paid(request.id, document.body.dataset.name, reference);
    },

    init() {
        Payment.loadOrder();

        document.querySelectorAll('input[data-mask]').forEach(input => {
            const mask = Payment.MASKS[input.dataset.mask];
            if (!mask) return;

            input.addEventListener('input', () => input.value = mask(input.value));
        });

        Account.protectPage();
    }
};

/* paymentmethod.html */
function goToPayment() {
    const chosen = document.querySelector('input[name="payment"]:checked');

    if (!chosen) return Payment.fail('Please choose a payment method.');

    Payment.fail('');
    window.location.href = Payment.PAGES[chosen.value];
}

/* cardpayment.html + gcashpayment.html */
async function processPayment() {
    const method = document.body.dataset.method;
    const empty = Payment.REQUIRED[method].find(id => !Payment.value(id));

    if (empty) return Payment.fail('Please fill in your payment details first.');

    Payment.fail('');
    const button = document.querySelector('.PaymentButton');
    const done = Payment.element('DoneButton');
    const reference = Payment.reference();

    button.disabled = true;
    button.textContent = 'Processing…';

    await Payment.wait(Payment.DELAY);

    button.textContent = '✓ Paid';
    button.classList.add('PaymentPaid');
    Payment.receipt(method, reference);
    Payment.settle(reference);

    if (done) done.style.display = '';
}

Payment.init();
