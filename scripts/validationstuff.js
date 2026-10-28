/* Form validation.
   Each check returns '' if the value is OK, or an error message if it is not. */
const Validate = {
    value(id) {
        const field = document.getElementById(id);
        return field ? field.value.trim() : '';
    },

    digits(text) {
        return String(text).replace(/\D/g, '');
    },

    tomorrowISO() {
        const day = new Date();
        day.setDate(day.getDate() + 1);
        return day.toLocaleDateString('en-CA');
    },

    /* ---------- Commission fields ---------- */

    required(text, label) {
        return text ? '' : `Please fill in your ${label}.`;
    },

    budget(text) {
        if (!text) return 'Please enter your budget.';
        if (!/^\d+$/.test(text)) return 'Budget must be a whole number (digits only).';
        if (Number(text) < 100) return 'Minimum budget is ₱100.';
        if (Number(text) > 100000) return 'Maximum budget is ₱100,000.';
        return '';
    },

    deadline(text) {
        if (!text) return 'Please choose a deadline.';
        if (text < Validate.tomorrowISO()) return 'Deadline must be tomorrow or later.';
        return '';
    },

    /* ---------- Payment fields ---------- */

    card(text) {
        if (!text) return 'Please enter your card number.';

        const number = Validate.digits(text);
        if (number.length < 13 || number.length > 19) return 'Card number must be 13 to 19 digits.';
        return '';
    },

    expiry(text) {
        const match = /^(\d{2})\/(\d{2})$/.exec(text);
        if (!match) return 'Enter the expiry date as MM/YY.';

        const month = Number(match[1]);
        if (month < 1 || month > 12) return 'Month must be between 01 and 12.';

        if (new Date(2000 + Number(match[2]), month, 1) <= new Date()) return 'This card has expired.';
        return '';
    },

    cvv(text) {
        return /^\d{3,4}$/.test(text) ? '' : 'Security code must be 3 or 4 digits.';
    },

    gcash(text) {
        const ok = /^09\d{9}$/.test(Validate.digits(text));
        return ok ? '' : 'Enter an 11-digit mobile number starting with 09 (e.g., 0912 345 6789).';
    },

    /* Shows the message under the field */
    showError(id, message) {
        const field = document.getElementById(id);
        if (!field) return;

        let note = document.getElementById(id + 'Error');

        if (!note) {
            note = document.createElement('small');
            note.id = id + 'Error';
            note.className = 'FieldError';

            const spot = field.type === 'checkbox' ? field.closest('label') || field : field;
            spot.insertAdjacentElement('afterend', note);
        }

        note.textContent = message;
        field.classList.toggle('InvalidField', Boolean(message));
    },

    /* rules of the validation*/
    run(rules) {
        let first = '';

        rules.forEach(rule => {
            const message = rule.test();
            Validate.showError(rule.id, message);
            if (message && !first) first = rule.id;
        });

        if (first) document.getElementById(first).focus();
        return !first;
    },

    /* Check a field when the user leaves it, then it will keep re-checking while until the user fix it */
    live(id, test) {
        const field = document.getElementById(id);
        if (!field) return;

        field.addEventListener('blur', () => Validate.showError(id, test()));
        field.addEventListener('input', () => {
            if (field.classList.contains('InvalidField')) Validate.showError(id, test());
        });
    },

    /* Blocks any sumbols */
    wholeNumbersOnly(id) {
        const field = document.getElementById(id);
        if (!field) return;

        field.addEventListener('keydown', event => {
            if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
        });
    }
};