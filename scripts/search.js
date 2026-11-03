/* User search for search.html - results listed from a ?q= query */

const resultsContainer = document.getElementById('searchResults');
const emptyContainer = document.getElementById('searchEmpty');
const hintContainer = document.getElementById('searchHint');
const labelContainer = document.getElementById('searchLabel');

/* Escape user-controlled text before inserting into html */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* Render the list of matching accounts as vertical list items */
function renderResults(accounts, query) {
    resultsContainer.innerHTML = '';
    emptyContainer.style.display = 'none';
    hintContainer.style.display = 'none';

    if (!query) {
        hintContainer.style.display = 'block';
        labelContainer.style.display = 'none';
        return;
    }

    labelContainer.textContent = escapeHtml(query) + ':';
    labelContainer.style.display = 'block';

    if (!accounts.length) {
        emptyContainer.style.display = 'block';
        return;
    }

    accounts.forEach((account) => {
        const avatar = account.avatar || './assets/images/MyAvatar_Pic_Template.png';
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action search-list-item text-decoration-none text-dark';
        item.href = `./profile.html?user=${encodeURIComponent(account.username)}`;
        item.innerHTML = `
            <img src="${escapeHtml(avatar)}" class="search-list-avatar rounded-circle" alt="${escapeHtml(account.username)} avatar" width="48" height="48">
            <span class="search-list-username">${escapeHtml(account.username)}</span>
        `;
        resultsContainer.appendChild(item);
    });
}

/* Fetch all accounts and filter by username (case-insensitive) */
async function performSearch(query) {
    const term = query.trim();
    if (!term) {
        renderResults([], '');
        return;
    }

    try {
        const accounts = await Account.all();
        const matches = accounts.filter((account) =>
            account.username.toLowerCase().includes(term.toLowerCase())
        );
        renderResults(matches, term);
    } catch (err) {
        console.error('Search failed', err);
        resultsContainer.innerHTML = '';
        emptyContainer.textContent = 'Could not load users. Try again later.';
        emptyContainer.style.display = 'block';
        hintContainer.style.display = 'none';
        labelContainer.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!resultsContainer) return;

    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';
    if (initial) {
        performSearch(initial);
    }
});
