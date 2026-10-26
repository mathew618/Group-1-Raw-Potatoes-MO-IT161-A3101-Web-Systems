/* Artwork API linkage (MySQL artworks table) */
const Artwork = {
    API: '/api/artworks',

    async sync(artistId, item, artworkId) {
        try {
            if (artworkId) {
                const res = await fetch(`${Artwork.API}/${artworkId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: item.ptitle, description: item.pdesc })
                });
                return res.ok ? await res.json() : null;
            }

            const res = await fetch(Artwork.API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artist_id: artistId,
                    title: item.ptitle,
                    description: item.pdesc,
                    image: item.image
                })
            });
            return res.ok ? await res.json() : null;
        } catch {
            return null;
        }
    },

    async fetchByArtist(artistId) {
        try {
            const res = await fetch(`${Artwork.API}?artist_id=${encodeURIComponent(artistId)}`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    }
};