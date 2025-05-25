import { Pet } from './pet.js';

document.addEventListener('DOMContentLoaded', () => {
    const p = new Pet();
    p.petType = 'Cat';
    p.petName = 'Whiskers';
    p.petAge = 4;
    p.daysStay = 3;
    p.amountDue = 120.00;

    const app = document.getElementById('app');

    // Clear any previous content
    app.innerHTML = '';

    // Create and append a header
    const h1 = document.createElement('h1');
    h1.textContent = `Pet Boarding Summary for ${p.petName}`;
    app.appendChild(h1);

    // Build a list of pet details
    const ul = document.createElement('ul');
    [
        `Type: ${p.petType}`,
        `Age: ${p.petAge}`,
        `Dog Spaces: ${p.dogSpaces}`,
        `Cat Spaces: ${p.catSpaces}`,
        `Days Stay: ${p.daysStay}`,
        `Amount Due: $${p.amountDue.toFixed(2)}`
    ].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
    });
    app.appendChild(ul);
});
