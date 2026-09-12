document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('starlink-upit');
  const submitButton = document.getElementById('starlink-submit');

  if (!form || !submitButton) {
    return;
  }

  const nameInput = document.getElementById('starlink-name');
  const locationInput = document.getElementById('starlink-location');
  const equipmentSelect = document.getElementById('starlink-equipment');
  const unitsInput = document.getElementById('starlink-units');
  const dateInput = document.getElementById('starlink-date');
  const notesInput = document.getElementById('starlink-notes');
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  dateInput.min = today;

  [nameInput, locationInput].forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Upišite svoje ime.');
    locationInput.setCustomValidity(locationInput.value.trim() ? '' : 'Upišite mjesto ili područje.');

    if (!form.reportValidity()) {
      return;
    }

    const equipment = equipmentSelect.selectedOptions[0].textContent;
    const [year, month, day] = dateInput.value.split('-');
    const notes = notesInput.value.trim();
    const message = [
      `Bok, ja sam ${nameInput.value.trim()} i zanima me montaža Starlink sustava.`,
      '',
      `• Lokacija: ${locationInput.value.trim()}`,
      `• Starlink oprema: ${equipment}`,
      `• Broj jedinica: ${unitsInput.value}`,
      `• Željeni termin: ${day}.${month}.${year}.`,
      ...(notes ? [`• Dodatno: ${notes}`] : []),
      '',
      'Možete li mi se javiti kada stignete?',
    ].join('\n');
    const whatsappUrl = `https://wa.me/385953895875?text=${encodeURIComponent(message)}`;

    window.location.assign(whatsappUrl);
  });

  submitButton.type = 'submit';
});
