// ==========================================================================
// ÉTAT DE L'APPLICATION & CHARGEMENT INITIAL
// ==========================================================================
let shifts = JSON.parse(localStorage.getItem('releve_shifts')) || [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  renderCalendar();
  renderShiftsList();
  updateDashboardAndPay();
  
  // Met la date du jour par défaut dans le formulaire de la modale
  const dateInput = document.getElementById('shift-date');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }
}

// ==========================================================================
// NAVIGATION ENTRE LES ÉCRANS (ONGLETS)
// ==========================================================================
function switchTab(tabName, buttonElement) {
  // Masquer tous les écrans
  const screens = document.querySelectorAll('.view-screen');
  screens.forEach(screen => {
    screen.style.display = 'none';
  });

  // Afficher l'écran ciblé
  const targetScreen = document.getElementById(`view-${tabName}`);
  if (targetScreen) {
    targetScreen.style.display = 'block';
  }

  // Mettre à jour les classes active sur la barre de navigation
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  if (buttonElement) {
    buttonElement.classList.add('active');
  }
}

// ==========================================================================
// GESTION DES GARDES & LOCALSTORAGE
// ==========================================================================
function openShiftModal() {
  const modal = document.getElementById('shift-modal');
  if (modal) modal.style.display = 'flex';
}

function closeShiftModal() {
  const modal = document.getElementById('shift-modal');
  if (modal) modal.style.display = 'none';
}

function saveShift(event) {
  event.preventDefault();
  
  const dateVal = document.getElementById('shift-date').value;
  const typeVal = document.getElementById('shift-type').value;

  if (!dateVal) return;

  const newShift = {
    id: Date.now(),
    date: dateVal,
    type: typeVal, // 'day' ou 'night'
    hours: 12
  };

  shifts.push(newShift);
  localStorage.setItem('releve_shifts', JSON.stringify(shifts));

  closeShiftModal();
  initApp();
}

function deleteShift(id) {
  shifts = shifts.filter(shift => shift.id !== id);
  localStorage.setItem('releve_shifts', JSON.stringify(shifts));
  initApp();
}

// ==========================================================================
// CALENDRIER & LISTE DES GARDES
// ==========================================================================
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('current-month-label');
  if (!grid || !monthLabel) return;

  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const options = { month: 'long', year: 'numeric' };
  monthLabel.textContent = currentDate.toLocaleDateString('fr-FR', options);

  // Noms des jours
  ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.textContent = day;
    dayHeader.style.fontSize = '11px';
    dayHeader.style.color = 'var(--text-secondary)';
    dayHeader.style.fontWeight = '600';
    grid.appendChild(dayHeader);
  });

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Cases vides du mois précédent
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    grid.appendChild(emptyCell);
  }

  // Jours du mois
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-badge';
    dayCell.textContent = day;

    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${year}-${formattedMonth}-${formattedDay}`;

    const shiftOnThisDay = shifts.find(s => s.date === dateString);
    if (shiftOnThisDay) {
      if (shiftOnThisDay.type === 'night') {
        dayCell.classList.add('night-shift');
      } else {
        dayCell.classList.add('day-shift');
      }
    }

    grid.appendChild(dayCell);
  }
}

function renderShiftsList() {
  const container = document.getElementById('shifts-list-container');
  if (!container) return;

  container.innerHTML = '';

  if (shifts.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px;">Aucune garde enregistrée.</p>';
    return;
  }

  // Tri par date décroissante
  const sortedShifts = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedShifts.forEach(shift => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems: 'center';
    card.style.marginBottom = '10px';
    card.style.padding = '12px 16px';

    const typeText = shift.type === 'night' ? '🌙 Garde de Nuit (12h)' : '☀️ Garde de Jour (12h)';
    const badgeColor = shift.type === 'night' ? '#c2c0ff' : '#ffb340';

    card.innerHTML = `
      <div>
        <strong style="font-size: 13px; display: block; color: var(--text-primary);">${shift.date}</strong>
        <span style="font-size: 11px; color: ${badgeColor};">${typeText}</span>
      </div>
      <button onclick="deleteShift(${shift.id})" style="background: rgba(255,59,48,0.15); color: #ff3b30; border: none; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;">Supprimer</button>
    `;

    container.appendChild(card);
  });
}

// ==========================================================================
// SIMULATEUR DE PAIE & EXPORT RH
// ==========================================================================
function updateDashboardAndPay() {
  let totalHours = shifts.length * 12;
  let normalHours = Math.min(totalHours, 152);
  let extraHours = Math.max(0, totalHours - 152);
  let nightCount = shifts.filter(s => s.type === 'night').length;
  
  let baseSalary = 1800;
  let normalPay = normalHours * 12;
  let extraPay = extraHours * 15;
  let nightBonus = nightCount * 25;
  let totalNet = baseSalary + (totalHours > 0 ? 300 : 0) + nightBonus;

  // Mise à jour Dashboard
  const dashSalary = document.getElementById('dash-salary');
  const dashHours = document.getElementById('dash-hours');
  if (dashSalary) dashSalary.textContent = `${totalNet} €`;
  if (dashHours) dashHours.textContent = `${totalHours}h / 169h`;

  // Mise à jour Paie
  const payNormal = document.getElementById('pay-normal-hours');
  const payExtra = document.getElementById('pay-extra-hours');
  const payBonus = document.getElementById('pay-bonus');
  const payTotal = document.getElementById('pay-total-net');

  if (payNormal) payNormal.textContent = `${normalHours}h`;
  if (payExtra) payExtra.textContent = `${extraHours}h`;
  if (payBonus) payBonus.textContent = `${nightBonus + (shifts.length * 10)} €`;
  if (payTotal) payTotal.textContent = `${totalNet} €`;
}

function exportToHR() {
  let totalHours = shifts.length * 12;
  let nightCount = shifts.filter(s => s.type === 'night').length;
  let text = `--- RÉCAPITULATIF RH : RELÈVE ---\nTotal heures : ${totalHours}h\nGardes de nuit : ${nightCount}\nNombre total de gardes : ${shifts.length}`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Récapitulatif copié dans le presse-papier !');
  }).catch(err => {
    console.error('Erreur lors de la copie', err);
  });
}