const GALLERY_FALLBACK = 'assets/images/MyAvatar_Pic_Template.png';

function showImage(img, src, fallback = GALLERY_FALLBACK) {
    img.onerror = () => {
        img.onerror = null;
        img.src = fallback;
    };
    img.src = src || fallback;
}

class GalleryViewer {
    constructor() {
        this.modal = document.getElementById('ArtworkViewer');
        this.image = document.getElementById('ArtworkImage');
        this.title = document.getElementById('ViewTitle');
        this.desc = document.getElementById('ViewDesc');
        this.statusRow = document.getElementById('ViewStatusRow');
        this.status = document.getElementById('ViewStatus');

        document.getElementById('ArtworkClose').addEventListener('click', () => this.close());

        this.modal.addEventListener('click', event => {
            if (event.target === this.modal) this.close();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') this.close();
        });
    }

    open(item, withStatus = false) {
        this.image.classList.add('has-image');
        showImage(this.image, item.image);

        this.title.textContent = item.title || 'Untitled';
        this.desc.textContent = item.desc;
        this.statusRow.style.display = withStatus ? 'flex' : 'none';

        if (withStatus) {
            const isOpen = String(item.status).toLowerCase() === 'open';

            this.status.textContent = String(item.status || 'closed').toUpperCase();
            this.status.classList.toggle('statusOpen', isOpen);
            this.status.classList.toggle('statusClosed', !isOpen);
        }

        this.modal.classList.add('show');
    }

    close() {
        this.modal.classList.remove('show');
    }
}

function renderGalleryCards(container, items, onCardClick, options = {}) {
    container.innerHTML = '';

    if (options.empty) {
        document.getElementById(options.empty).style.display = items.length ? 'none' : 'block';
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'GalleryCard';

        const img = document.createElement('img');
        img.className = 'GalleryThumb';
        img.alt = item.title || '';
        showImage(img, item.image);
        card.appendChild(img);

        if (options.overlay) {
            const overlay = document.createElement('div');
            overlay.className = 'EditOverlay';
            overlay.textContent = options.overlay;
            overlay.addEventListener('click', event => {
                event.stopPropagation();
                options.onEdit(item);
            });
            card.appendChild(overlay);
        }

        card.addEventListener('click', () => onCardClick(item));
        container.appendChild(card);
    });
}

function renderCommissionCards(container, items, onCardClick, options = {}) {
    container.innerHTML = '';

    if (options.empty) {
        document.getElementById(options.empty).style.display = items.length ? 'none' : 'block';
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'CommissionCard';

        const media = document.createElement('div');
        media.className = 'UploadSpecimen';

        const img = document.createElement('img');
        img.className = 'has-image';
        img.alt = item.title || '';
        showImage(img, item.image);
        media.appendChild(img);

        const details = document.createElement('div');
        details.className = 'StuffToDo';

        const title = document.createElement('h2');
        title.className = 'CommissionTitle';
        title.textContent = item.title || 'Untitled';

        const desc = document.createElement('p');
        desc.className = 'CommissionDesc';
        desc.textContent = item.desc;

        const statusRow = document.createElement('div');
        statusRow.className = 'CommissionStatusRow';

        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'Status: ';

        const isOpen = String(item.status).toLowerCase() === 'open';
        const status = document.createElement('span');
        status.className = 'CommissionStatus ' + (isOpen ? 'statusOpen' : 'statusClosed');
        status.textContent = String(item.status || 'closed').toUpperCase();

        statusRow.append(statusLabel, status);
        details.append(title, desc, statusRow);

        const actions = document.createElement('div');
        actions.className = 'CommissionActions';

        if (options.onEdit) {
            actions.appendChild(commissionAction('Edit', 'CommissionEditBtn', options.onEdit, item));
        }
        if (options.onTerms) {
            actions.appendChild(commissionAction('Edit Form', 'CommissionTermsBtn', options.onTerms, item));
        }
        if (actions.childElementCount) details.appendChild(actions);

        card.append(media, details);
        card.addEventListener('click', () => onCardClick(item));
        container.appendChild(card);
    });
}

function commissionAction(label, className, handler, item) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', event => {
        event.stopPropagation();
        handler(item);
    });
    return button;
}
