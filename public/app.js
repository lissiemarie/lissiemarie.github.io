import { Pet } from './pet.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1) Create Pet
    const p = new Pet();
    p.petType = 'Cat';
    p.petName = 'Whiskers';
    p.petAge = 4;
    p.daysStay = 3;
    p.amountDue = 120.00;

    // 2) Grab static elements
    const titleEl = document.getElementById('pet-title');
    const detailsUl = document.getElementById('pet-details');

    // 3) Fill in the title
    titleEl.textContent = `Pet Boarding Summary for ${p.petName}`;

    // 4) Define the details to show
    const details = [
        `Type: ${p.petType}`,
        `Age: ${p.petAge}`,
        `Dog Spaces: ${p.dogSpaces}`,
        `Cat Spaces: ${p.catSpaces}`,
        `Days Stay: ${p.daysStay}`,
        `Amount Due: $${p.amountDue.toFixed(2)}`
    ];

    // 5) Inject <li> items
    detailsUl.innerHTML = '';            // clear any old items
    details.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        detailsUl.appendChild(li);
    });
});

