// app.js

// --- Controls ---
const petListDiv = document.getElementById('pet-list');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const showPetsBtn = document.getElementById('showPetsBtn');
const typeFilter = document.getElementById('typeFilter');
const waitlistList = document.getElementById('waitlist-list');
let petsVisible = false;

// --- Modals & Forms ---
const spaModal = document.getElementById('spaModal');
const spaModalClose = document.getElementById('spaModalClose');
const spaModalForm = document.getElementById('spaModalForm');

const waitlistModal = document.getElementById('waitlistModal');
const waitlistClose = document.getElementById('waitlistClose');
const waitlistForm = document.getElementById('waitlistForm');
const waitPetNameInput = document.getElementById('waitPetName');
const waitPhoneInput = document.getElementById('waitPhone');

// For Spa modal state
let currentPetId = null;
let currentPetType = null;
let currentDaysStay = null;

// --- 1) Fetch & Render Pets ---
async function fetchAndRender() {
    const searchValue = searchInput.value.trim();
    const typeValue = typeFilter.value;
    const sortValue = sortSelect.value;

    const params = new URLSearchParams();
    if (searchValue) params.append('search', searchValue);
    if (typeValue) params.append('petType', typeValue);
    if (sortValue) params.append('sort', sortValue);

    try {
        const res = await fetch('/api/pets?' + params.toString());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const pets = await res.json();

        petListDiv.innerHTML = '';
        if (pets.length === 0) {
            petListDiv.textContent = 'No active pets found.';
            return;
        }

        pets.forEach(pet => {
            const card = document.createElement('div');
            card.className = 'card pet-card';

            let spaServicesHtml = '';
            if (pet.grooming && pet.grooming.length > 0) {
                spaServicesHtml = pet.grooming.map(service =>
                    `<li>
                        Spa: ${service} ($10)
                        <button class="delete-spa-btn" data-id="${pet._id}" data-service="${service}">Delete</button>
                    </li>`
                ).join('');
            } else {
                spaServicesHtml = '<li>No spa services</li>';
            }

            card.innerHTML = `
                <h3>${pet.petName} (${pet.petType})</h3>
                <p>Age: ${pet.petAge}</p>
                <p>Stay: ${pet.daysStay} day(s)</p>
                <div>
                  <strong>Charges:</strong>
                  <ul>
                    <li>Boarding: $${(pet.petType === 'dog' ? 50 : 40) * pet.daysStay}</li>
                    ${spaServicesHtml}
                  </ul>
                  <strong>Total Due: $${pet.amountDue.toFixed(2)}</strong>
                </div>
                <button data-id="${pet._id}" class="checkout-btn">Check Out</button>
                <button data-id="${pet._id}" data-type="${pet.petType}" data-days="${pet.daysStay}" class="spa-btn">Add Spa Services</button>
            `;
            petListDiv.appendChild(card);
        });

        // wire events
        document.querySelectorAll('.checkout-btn').forEach(btn =>
            btn.addEventListener('click', e => checkOut(e.target.dataset.id))
        );
        document.querySelectorAll('.spa-btn').forEach(btn =>
            btn.addEventListener('click', e => {
                currentPetId = e.target.dataset.id;
                currentPetType = e.target.dataset.type;
                currentDaysStay = e.target.dataset.days;
                spaModalForm.reset();
                spaModal.style.display = 'flex';
            })
        );
        document.querySelectorAll('.delete-spa-btn').forEach(btn =>
            btn.addEventListener('click', e =>
                deleteSpaService(e.target.dataset.id, e.target.dataset.service)
            )
        );

    } catch (err) {
        console.error('Fetch error:', err);
        petListDiv.innerHTML = '<p style="color:red;">Failed to load pets.</p>';
    }
}

// --- 2) Fetch & Render Waitlist ---
async function fetchAndRenderWaitlist() {
    try {
        const res = await fetch('/api/waitlist');
        if (!res.ok) throw new Error('Failed to fetch waitlist');
        const list = await res.json();

        waitlistList.innerHTML = '';
        if (list.length === 0) {
            waitlistList.innerHTML = '<li>No one on the waitlist.</li>';
            return;
        }

        list.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.petName}</strong> (${entry.petType}, ${entry.petAge}yr) <strong>Length of stay:</strong>    
                ${entry.daysStay} day(s) 
                <a href="tel:${entry.phone}">${entry.phone}</a>
                <button class="admit-wait-btn" data-id="${entry._id}">Admit</button>
                <button class="remove-wait-btn" data-id="${entry._id}">Remove</button>
            `;
            waitlistList.appendChild(li);
        });

        // wire admit/remove buttons
        document.querySelectorAll('.admit-wait-btn').forEach(btn =>
            btn.addEventListener('click', e => admitFromWaitlist(e.target.dataset.id))
        );
        document.querySelectorAll('.remove-wait-btn').forEach(btn =>
            btn.addEventListener('click', e => removeFromWaitlist(e.target.dataset.id))
        );
    } catch (err) {
        console.error(err);
        waitlistList.innerHTML = '<li style="color:red;">Error loading waitlist.</li>';
    }
}

// --- 3) Remove from Waitlist ---
async function removeFromWaitlist(id) {
    try {
        const res = await fetch('/api/waitlist/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        fetchAndRenderWaitlist();
    } catch (err) {
        console.error(err);
        alert('Error removing from waitlist');
    }
}

// --- 4) Admit from Waitlist ---
async function admitFromWaitlist(id) {
    try {
        const res = await fetch('/api/waitlist/' + id + '/admit', { method: 'POST' });
        if (!res.ok) throw new Error('Admit failed');
        // refresh both lists
        fetchAndRender();
        fetchAndRenderWaitlist();
    } catch (err) {
        console.error(err);
        alert('Error admitting from waitlist');
    }
}

// --- 5) Delete Spa Service ---
async function deleteSpaService(petId, service) {
    try {
        const resPet = await fetch('/api/pets/' + petId);
        if (!resPet.ok) throw new Error('Pet not found');
        const pet = await resPet.json();
        const updatedGrooming = (pet.grooming || []).filter(s => s !== service);
        const amountDue = calculateAmount(pet.petType, pet.daysStay, updatedGrooming);

        const res = await fetch('/api/pets/' + petId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grooming: updatedGrooming, amountDue })
        });
        if (!res.ok) throw new Error('Failed to delete spa service');
        fetchAndRender();
    } catch (err) {
        console.error(err);
        alert('Error deleting spa service');
    }
}

// --- 6) Check Out Pet ---
async function checkOut(id) {
    try {
        const res = await fetch('/api/pets/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('Check out failed');
        fetchAndRender();
    } catch (err) {
        console.error(err);
        alert('Error during check-out');
    }
}

// --- 7) Admit New Pet (with capacity check) ---
const addForm = document.getElementById('addPetForm');
addForm.addEventListener('submit', async e => {
    e.preventDefault();
    const petType = document.getElementById('petType').value;
    const petName = document.getElementById('petName').value.trim();
    const petAge = parseInt(document.getElementById('petAge').value, 10);
    const daysStay = parseInt(document.getElementById('daysStay').value, 10);
    const grooming = Array.from(document.querySelectorAll('input[name="grooming"]:checked')).map(cb => cb.value);
    const amountDue = calculateAmount(petType, daysStay, grooming);

    // capacity check
    try {
        const resActive = await fetch(`/api/pets?petType=${petType}`);
        const activePets = await resActive.json();
        const limit = 5;
        if (activePets.length >= limit) {
            waitPetNameInput.value = petName;
            waitPhoneInput.value = '';
            waitlistModal.style.display = 'flex';
            return;
        }
    } catch (err) {
        console.error('Capacity check failed:', err);
        alert('Error checking capacity');
        return;
    }

    // admit directly
    try {
        const res = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ petType, petName, petAge, daysStay, grooming, amountDue })
        });
        if (!res.ok) throw new Error('Admission failed');
        addForm.reset();
        fetchAndRender();
        fetchAndRenderWaitlist();
    } catch (err) {
        console.error(err);
        alert('Error admitting new pet');
    }
});

// --- 8) Waitlist Form Submission ---
waitlistForm.addEventListener('submit', async e => {
    e.preventDefault();
    const petType = document.getElementById('petType').value;
    const petName = waitPetNameInput.value.trim();
    const petAge = parseInt(document.getElementById('petAge').value, 10);
    const daysStay = parseInt(document.getElementById('daysStay').value, 10);
    const grooming = Array.from(document.querySelectorAll('input[name="grooming"]:checked')).map(cb => cb.value);
    const amountDue = calculateAmount(petType, daysStay, grooming);
    const phone = waitPhoneInput.value.trim();

    try {
        const res = await fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ petType, petName, petAge, daysStay, grooming, amountDue, phone })
        });
        if (!res.ok) throw new Error('Waitlist failed');
        alert(`${petName} added to waitlist. Call ${phone} when space is available.`);
        waitlistModal.style.display = 'none';
        addForm.reset();
        fetchAndRender();
        fetchAndRenderWaitlist();
    } catch (err) {
        console.error(err);
        alert('Error adding to waitlist');
    }
});

// --- 9) Utility: Calculate Amount ---
function calculateAmount(petType, daysStay, grooming) {
    const baseRate = petType === 'dog' ? 50 : 40;
    const groomingCost = grooming.length * 10;
    return baseRate * daysStay + groomingCost;
}

// --- 10) Modal Logic ---
if (spaModal && spaModalClose && spaModalForm) {
    spaModalClose.onclick = () => {
        spaModal.style.display = 'none';
        currentPetId = null;
    };
    waitlistClose.onclick = () => {
        waitlistModal.style.display = 'none';
    };
    window.onclick = e => {
        if (e.target === spaModal) {
            spaModal.style.display = 'none';
            currentPetId = null;
        }
        if (e.target === waitlistModal) {
            waitlistModal.style.display = 'none';
        }
    };
    spaModalForm.onsubmit = async e => {
        e.preventDefault();
        if (!currentPetId) return;
        const additional = Array.from(spaModalForm.querySelectorAll('input[name="grooming"]:checked')).map(cb => cb.value);
        if (additional.length === 0) {
            alert('Select at least one service');
            return;
        }
        try {
            const resPet = await fetch(`/api/pets/${currentPetId}`);
            if (!resPet.ok) throw new Error('Pet not found');
            const pet = await resPet.json();
            const updatedGrooming = Array.from(new Set([...(pet.grooming || []), ...additional]));
            const amountDue = calculateAmount(pet.petType, pet.daysStay, updatedGrooming);
            const res = await fetch(`/api/pets/${currentPetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grooming: updatedGrooming, amountDue })
            });
            if (!res.ok) throw new Error('Failed to add spa services');
            spaModal.style.display = 'none';
            fetchAndRender();
        } catch (err) {
            console.error(err);
            alert('Error adding spa services');
        }
    };
}

// --- 11) Show/Hide Pets Toggle ---
if (showPetsBtn) {
    showPetsBtn.addEventListener('click', () => {
        if (!petsVisible) {
            petListDiv.style.display = 'block';
            showPetsBtn.textContent = 'Hide Active Pets';
            petsVisible = true;
            fetchAndRender();
            fetchAndRenderWaitlist();
        } else {
            petListDiv.innerHTML = '';
            petListDiv.style.display = 'none';
            showPetsBtn.textContent = 'Show Active Pets';
            petsVisible = false;
        }
    });
}

// --- 12) Initial Load ---
petListDiv.style.display = 'none';
document.addEventListener('DOMContentLoaded', () => {
    // Enter key in search box
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (!petsVisible) {
                petListDiv.style.display = 'block';
                showPetsBtn.textContent = 'Hide Active Pets';
                petsVisible = true;
            }
            fetchAndRender();
        }
    });

    // Search button
    searchBtn.addEventListener('click', () => {
        if (!petsVisible) {
            petListDiv.style.display = 'block';
            showPetsBtn.textContent = 'Hide Active Pets';
            petsVisible = true;
        }
        fetchAndRender();
    });

    // initial waitlist render
    fetchAndRenderWaitlist();
});
