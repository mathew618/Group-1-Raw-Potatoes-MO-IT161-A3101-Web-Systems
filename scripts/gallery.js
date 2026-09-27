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
