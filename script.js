// Inject extension HTML directly into the active webpage
(function injectWidget() {
  const wrapper = document.createElement('div');
  wrapper.className = 'controls-wrapper';
  wrapper.innerHTML = `
    <div id="pixel-pet" class="pixel-pet resting">
      <div id="speech-bubbles" class="speech-bubbles"></div>
      <span id="pet-avatar"><img src="${chrome.runtime.getURL('cat-moveupdown.webp')}" alt="Cat Pet" /></span>
    </div>

    <div id="controls-panel" class="controls-panel collapsed">
      <div class="panel-header" id="cat-panel-header">
        <h3>Cat Companion</h3>
        <span id="collapse-icon" class="collapse-icon">▼</span>
      </div>

      <div id="panel-content" class="panel-content">
        <div class="button-group">
          <button id="toggle-movement-btn" class="btn action-btn">🐾 Start Moving</button>
        </div>

        <div class="reminder-input-container">
          <input type="text" id="reminder-input" placeholder="Type a reminder..." maxlength="100" />
          <button class="btn add-btn" id="add-reminder-btn">Add</button>
        </div>

        <div id="reminders-list" class="reminders-list"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // Attach Event Listeners
  document.getElementById('cat-panel-header').addEventListener('click', togglePanel);
  document.getElementById('toggle-movement-btn').addEventListener('click', toggleMovement);
  document.getElementById('add-reminder-btn').addEventListener('click', addReminder);
  document.getElementById('reminder-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addReminder();
  });
})();

let reminders = [];
let isMoving = false;

// Expand / Collapse Panel Toggle
function togglePanel() {
  const panel = document.getElementById('controls-panel');
  panel.classList.toggle('collapsed');
}

// Toggle movement state between resting on the control panel and running
function toggleMovement() {
  const pet = document.getElementById('pixel-pet');
  const button = document.getElementById('toggle-movement-btn');

  isMoving = !isMoving;

  if (isMoving) {
    pet.classList.remove('resting');
    void pet.offsetWidth; // Force reflow
    pet.classList.add('running');
    button.textContent = '🛋️ Sit Down';
  } else {
    pet.classList.remove('running');
    pet.classList.add('resting');
    button.textContent = '🐾 Start Moving';
  }
}

// Add a new reminder phrase
function addReminder() {
  const input = document.getElementById('reminder-input');
  const text = input.value.trim();

  if (text === '') return;

  reminders.push(text);
  input.value = '';

  renderReminders();
}

// Remove a specific reminder by index
function removeReminder(index) {
  reminders.splice(index, 1);
  renderReminders();
}

// Update both the Speech Bubbles and the Controls UI List
function renderReminders() {
  const bubblesContainer = document.getElementById('speech-bubbles');
  const listContainer = document.getElementById('reminders-list');

  // Render Speech Bubbles above character
  bubblesContainer.innerHTML = reminders
    .map(text => `<div class="bubble">• ${escapeHtml(text)}</div>`)
    .join('');

  // Render active reminders in controls panel
  listContainer.innerHTML = reminders
    .map((text, index) => `
      <div class="reminder-item">
        <span>${escapeHtml(text)}</span>
        <button class="clear-btn" onclick="removeReminder(${index})">✕</button>
      </div>
    `)
    .join('');
}

// Helper to escape special HTML characters
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Allow pressing "Enter" key in input field to add reminder
document.getElementById('reminder-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addReminder();
  }
});