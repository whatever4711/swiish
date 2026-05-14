let csrfToken = null;

export async function fetchCsrfToken() {
    try {
        const res = await fetch('/api/csrf-token', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            csrfToken = data.csrfToken;
        }
    } catch (e) {
        console.error('CSRF fetch failed', e);
    }
}

export async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (csrfToken && (options.method === 'POST' || options.method === 'DELETE')) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    const res = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include'
    });
    // if 403 CSRF, try to refresh token once
    if (res.status === 403 && options.method !== 'GET') {
        await fetchCsrfToken();
        headers['X-CSRF-Token'] = csrfToken;
        return fetch(endpoint, { ...options, headers, credentials: 'include' });
    }
    return res;
}