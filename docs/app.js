// docs/app.js

const petListDiv = document.getElementById('pet-list');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const showPetsBtn = document.getElementById('showPetsBtn');
let petsVisible = false;

// Modal elements for spa services
let currentPetId = null;
let currentPetType = null;
let currentDaysStay = null;
const spaModal = document.getElementById('spaModal');
const spaModalClose = document.getElementById('spaModalClose');
const spaModalForm = document.getElementById('spaModalForm');

// 1) Fetch & Render (combination of sort & search)
async function fetchAndRender() {
    const sortValue = sortSelect.value;
    const searchValue = searchInput.value.trim();

    const params = new URLSearchParams();
    if (sortValue) params.append('sort', sortValue);
    if (searchValue) params.append('search', searchValue);

    try {
        const res = await fetch(`/api/pets?${params.toString()}`);
        if (!res.ok) throw new Error('Network error');
        const pets = await res.json();

        petListDiv.innerHTML = '';
        if (pets.length === 0) {
            petListDiv.textContent = 'No active pets found.';
            return;
        }

        pets.forEach(pet => {
            const card = document.createElement('div');
            card.className = 'pet-card';

            // Build spa services list with delete buttons
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
                <p>Status: ${pet.status}</p>
                <button data-id="${pet._id}" class="checkout-btn">Check Out</button>
                <button data-id="${pet._id}" data-type="${pet.petType}" data-days="${pet.daysStay}" class="spa-btn">Add Spa Services</button>
                `;
            petListDiv.appendChild(card);
        });

        //event listeners for checkout
        document.querySelectorAll('.checkout-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const petId = e.target.dataset.id;
                checkOut(petId);
            });
        });

        //event listeners for spa modal
        document.querySelectorAll('.spa-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                currentPetId = e.target.dataset.id;
                currentPetType = e.target.dataset.type;
                currentDaysStay = e.target.dataset.days;
                spaModalForm.reset();
                spaModal.style.display = 'flex';
            });
        });

        //event listeners for deleting spa services
        document.querySelectorAll('.delete-spa-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const petId = e.target.dataset.id;
                const service = e.target.dataset.service;
                await deleteSpaService(petId, service);
            });
        });

    } catch (err) {
        console.error(err);
        petListDiv.innerHTML = '<p style="color:red;">Failed to load pets.</p>';
    }
}

// Add this function to handle spa service deletion
async function deleteSpaService(petId, service) {
    try {
        // Fetch the pet to get current data
        const resPet = await fetch(`/api/pets/${petId}`);
        if (!resPet.ok) throw new Error('Pet not found.');
        const pet = await resPet.json();
        if (!pet) throw new Error('Pet not found.');

        // Remove the selected service
        const updatedGrooming = (pet.grooming || []).filter(s => s !== service);
        const amountDue = calculateAmount(pet.petType, pet.daysStay, updatedGrooming);

        // Update the pet (requires PUT route in backend)
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grooming: updatedGrooming, amountDue })
        });
        if (!res.ok) throw new Error('Failed to delete spa service.');
        fetchAndRender();
    } catch (err) {
        console.error(err);
        alert('Error deleting spa service.');
    }
}

// 2) Check Out (calls DELETE /api/pets/:id)
async function checkOut(id) {
    try {
        const res = await fetch(`/api/pets/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Check out failed');
        fetchAndRender();
    } catch (err) {
        console.error(err);
        alert('Error during check-out.');
    }
}

// 3) Add Pet Form (POST /api/pets)
const addForm = document.getElementById('addPetForm');
addForm.addEventListener('submit', async e => {
    e.preventDefault();
    const petType = document.getElementById('petType').value;
    const petName = document.getElementById('petName').value.trim();
    const petAge = parseInt(document.getElementById('petAge').value, 10);
    const daysStay = parseInt(document.getElementById('daysStay').value, 10);
    const grooming = Array.from(
        document.querySelectorAll('input[name="grooming"]:checked')
    ).map(cb => cb.value);
    const amountDue = calculateAmount(petType, daysStay, grooming);

    const newPet = { petType, petName, petAge, daysStay, grooming, amountDue };

    try {
        const res = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPet)
        });
        if (!res.ok) throw new Error('Admission failed');
        addForm.reset();
        fetchAndRender();
    } catch (err) {
        console.error(err);
        alert('Error admitting new pet.');
    }
});

// Show/Hide pets button
if (showPetsBtn) {
    showPetsBtn.addEventListener('click', () => {
        if (!petsVisible) {
            // Show all pets (clear search and sort)
            sortSelect.value = '';
            searchInput.value = '';
            petListDiv.style.display = 'block';
            fetchAndRender();
            showPetsBtn.textContent = 'Hide Active Pets';
            petsVisible = true;
        } else {
            // Hide pets
            petListDiv.innerHTML = '';
            petListDiv.style.display = 'none';
            showPetsBtn.textContent = 'Show Active Pets';
            petsVisible = false;
        }
    });
}

// 4) Utilities
function calculateAmount(petType, daysStay, grooming) {
    const baseRate = petType === 'dog' ? 50 : 40;
    const groomingCost = grooming.length * 10;
    return baseRate * daysStay + groomingCost;
}

// Modal logic for spa services
if (spaModal && spaModalClose && spaModalForm) {
    // Close modal on X
    spaModalClose.onclick = () => {
        spaModal.style.display = 'none';
        currentPetId = null;
    };
    // Close modal on outside click
    window.onclick = (event) => {
        if (event.target === spaModal) {
            spaModal.style.display = 'none';
            currentPetId = null;
        }
    };
    // Handle spa form submit
    spaModalForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentPetId) return;
        const grooming = Array.from(spaModalForm.querySelectorAll('input[name="grooming"]:checked')).map(cb => cb.value);
        if (grooming.length === 0) {
            alert('Select at least one service.');
            return;
        }
        try {
            // Fetch the pet to get current data
            const resPet = await fetch(`/api/pets/${currentPetId}`);
            if (!resPet.ok) throw new Error('Pet not found.');
            const pet = await resPet.json();
            if (!pet) throw new Error('Pet not found.');

            // Merge new grooming services with existing
            const updatedGrooming = Array.from(new Set([...(pet.grooming || []), ...grooming]));
            const amountDue = calculateAmount(pet.petType, pet.daysStay, updatedGrooming);

            // Update the pet (requires PUT route in backend)
            const res = await fetch(`/api/pets/${currentPetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grooming: updatedGrooming, amountDue })
            });
            if (!res.ok) throw new Error('Failed to add spa services.');
            spaModal.style.display = 'none';
            fetchAndRender();
        } catch (err) {
            console.error(err);
            alert('Error adding spa services.');
        }
    };
}

// On initial load
petListDiv.style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
    sortSelect.addEventListener('change', () => {
        if (!petsVisible) {
            petListDiv.style.display = 'block';
            showPetsBtn.textContent = 'Hide Active Pets';
            petsVisible = true;
        }
        fetchAndRender();
    });

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

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (!petsVisible) {
                petListDiv.style.display = 'block';
                showPetsBtn.textContent = 'Hide Active Pets';
                petsVisible = true;
            }
            fetchAndRender();
        });
    }
});